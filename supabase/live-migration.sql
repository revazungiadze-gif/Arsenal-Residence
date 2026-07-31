-- ═══════════════════════════════════════════════════════════════════════
-- ცოცხალი (EU) ბაზის მომზადება მობილური აპისთვის — მხოლოდ დანამატები:
--   1) mobile_dashboard_counts() — დეშბორდი 1 მოთხოვნით (RLS მოქმედებს)
--   2) mobile_marketing_stats()  — მარკეტინგის აგრეგატები PII-ის გარეშე
--   3) notifications → realtime პუბლიკაცია (ზარის ცოცხალი ბეჯი)
--   4) პროფილის დაცვის ტრიგერი — როლის თვითაწევის ხვრელის დახურვა
--   5) ცოცხალი ჩაწერის ტესტები (ბოლოს იწმინდება)
-- არსებული პოლისები/მონაცემები არ იცვლება. იდემპოტენტურია.
-- ═══════════════════════════════════════════════════════════════════════

-- 1) დეშბორდის მრიცხველები — security invoker → მოქმედებს leads_select RLS
create or replace function public.mobile_dashboard_counts()
returns json
language sql
stable
as $$
  select json_build_object(
    'leads', coalesce(
      (select json_object_agg(t.status, t.c)
       from (select status, count(*)::int as c
             from public.leads group by status) t),
      '{}'::json
    ),
    'apartments', coalesce(
      (select json_object_agg(t.status, t.c)
       from (select status, count(*)::int as c
             from public.apartments group by status) t),
      '{}'::json
    )
  );
$$;
grant execute on function public.mobile_dashboard_counts() to authenticated;

-- 2) მარკეტინგის აგრეგატები — definer, მაგრამ მხოლოდ რიცხვები, PII არასდროს
create or replace function public.mobile_marketing_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.get_my_role() is null then null
    else json_build_object(
      'total', (select count(*) from leads),
      'won',   (select count(*) from leads where status = 'won'),
      'lost',  (select count(*) from leads where status in ('lost','not_interested','invalid')),
      'by_status', (
        select coalesce(json_object_agg(s.status, s.c), '{}'::json)
        from (select status, count(*)::int c from leads group by status) s
      ),
      'sources', (
        select coalesce(json_agg(row_to_json(t)), '[]'::json)
        from (
          select coalesce(nullif(trim(source), ''), 'უცნობი') as source,
                 count(*)::int as c
          from leads group by 1 order by c desc limit 6
        ) t
      ),
      'monthly', (
        select coalesce(json_agg(row_to_json(m)), '[]'::json)
        from (
          select to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
                 count(*)::int as c
          from leads
          where created_at >= date_trunc('month', now()) - interval '5 months'
          group by 1 order by 1
        ) m
      ),
      'loss_reasons', (
        select coalesce(json_agg(row_to_json(r)), '[]'::json)
        from (
          select coalesce(nullif(trim(loss_reason), ''), 'მიზეზი უცნობია') as reason,
                 count(*)::int as c
          from leads where status in ('lost','not_interested')
          group by 1 order by c desc limit 6
        ) r
      )
    )
  end;
$$;
revoke all on function public.mobile_marketing_stats() from public;
grant execute on function public.mobile_marketing_stats() to authenticated;

-- 3) შეტყობინებების realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- 4) როლის თვითაწევის დახურვა: არა-ადმინი საკუთარ role/is_active/manager_id-ს
--    ვერ შეცვლის. service role (auth.uid() is null) და ადმინი თავისუფალია.
create or replace function public.mobile_guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;  -- service role / სერვერული ოპერაციები
  end if;
  if public.get_my_role() = 'admin' then
    return new;
  end if;
  if (to_jsonb(new)->>'role')       is distinct from (to_jsonb(old)->>'role')
  or (to_jsonb(new)->>'is_active')  is distinct from (to_jsonb(old)->>'is_active')
  or (to_jsonb(new)->>'manager_id') is distinct from (to_jsonb(old)->>'manager_id')
  then
    raise exception 'როლის/სტატუსის/მენეჯერის შეცვლა მხოლოდ ადმინს შეუძლია';
  end if;
  return new;
end;
$$;

drop trigger if exists mobile_guard_profile_update on public.profiles;
create trigger mobile_guard_profile_update
  before update on public.profiles
  for each row execute function public.mobile_guard_profile_update();

-- 5) ცოცხალი ტესტები აპის ზუსტი ოპერაციებით (admin-ის identity-ით)
create temp table diag(step text, info text);
grant all on diag to authenticated;

do $$
declare
  admin_id uuid;
  lid uuid; tid uuid; nid uuid;
  cnt_json json;
begin
  select id into admin_id from public.profiles where role = 'admin' limit 1;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', admin_id, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';

  -- ლიდის შექმნა ისე, როგორც აპი აგზავნის (to_contact + call)
  begin
    insert into public.leads (full_name, phone, source, status, priority, assigned_to, assigned_at)
    values ('__აპის სინქრო-ტესტი__', '+995500000009', 'call', 'to_contact', 'medium', admin_id, now())
    returning id into lid;
    update public.leads set status = 'no_answer' where id = lid;
    update public.leads
      set status = 'not_interested', loss_reason = 'other', loss_note = 'ტესტი'
      where id = lid;
    insert into diag values ('test » lead create/status/loss', 'OK');
  exception when others then
    insert into diag values ('test » lead create/status/loss', 'ERROR: ' || sqlerrm);
  end;

  -- შენიშვნა ლიდზე
  if lid is not null then
    begin
      insert into public.lead_notes (lead_id, content, user_id, author_id)
      values (lid, '__ტესტი__', admin_id, admin_id);
      insert into diag values ('test » lead note', 'OK');
    exception when others then
      insert into diag values ('test » lead note', 'ERROR: ' || sqlerrm);
    end;
  end if;

  -- დავალების ციკლი
  begin
    insert into public.tasks (title, status, priority, assigned_to, created_by)
    values ('__აპის სინქრო-ტესტი__', 'pending', 'medium', admin_id, admin_id)
    returning id into tid;
    update public.tasks set status = 'completed' where id = tid;
    delete from public.tasks where id = tid;
    insert into diag values ('test » tasks flow', 'OK');
  exception when others then
    insert into diag values ('test » tasks flow', 'ERROR: ' || sqlerrm);
  end;

  -- შეტყობინება system ტიპით
  begin
    insert into public.notifications (user_id, title, message, type)
    values (admin_id, '__აპის სინქრო-ტესტი__', 't', 'system')
    returning id into nid;
    insert into diag values ('test » notification system', 'OK');
  exception when others then
    insert into diag values ('test » notification system', 'ERROR: ' || sqlerrm);
  end;

  -- RPC-ები
  begin
    select public.mobile_dashboard_counts() into cnt_json;
    insert into diag values ('test » dashboard rpc', 'OK: ' || left(cnt_json::text, 80));
  exception when others then
    insert into diag values ('test » dashboard rpc', 'ERROR: ' || sqlerrm);
  end;
  begin
    select public.mobile_marketing_stats() into cnt_json;
    insert into diag values ('test » marketing rpc', case when cnt_json is null then 'NULL' else 'OK' end);
  exception when others then
    insert into diag values ('test » marketing rpc', 'ERROR: ' || sqlerrm);
  end;

  -- როლის თვითაწევის ტესტი: admin-ს ეშვება, ამიტომ აგენტის identity-ით
  execute 'reset role';
  perform set_config(
    'request.jwt.claims',
    (select json_build_object('sub', id, 'role', 'authenticated')::text
     from public.profiles where role = 'agent' limit 1),
    true
  );
  execute 'set local role authenticated';
  begin
    update public.profiles set role = 'admin'
    where id = (select (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
    insert into diag values ('test » role escalation blocked', 'FAILED — ესკალაცია გავიდა!');
  exception when others then
    insert into diag values ('test » role escalation blocked', 'OK (დაბლოკილია): ' || left(sqlerrm, 60));
  end;
end $$;

reset role;

-- ტესტ-რიგების გაწმენდა
delete from public.lead_notes where content = '__ტესტი__';
delete from public.leads where full_name = '__აპის სინქრო-ტესტი__';
delete from public.notifications where title = '__აპის სინქრო-ტესტი__';
delete from public.tasks where title = '__აპის სინქრო-ტესტი__';

select step, info from diag order by step;
