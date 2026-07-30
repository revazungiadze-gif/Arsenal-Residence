-- ═══════════════════════════════════════════════════════════════════════
-- დიაგნოსტიკა: რატომ ვერ ემატება ლიდი აპიდან
-- 1) CHECK/FK შეზღუდვები და NOT NULL სვეტები leads ცხრილზე + ტრიგერები
-- 2) სატესტო insert authenticated როლით (admin JWT) — ზუსტი შეცდომის დაჭერა
-- ═══════════════════════════════════════════════════════════════════════

create temp table diag(step text, info text);

insert into diag
select 'constraint: ' || conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.leads'::regclass and contype in ('c');

insert into diag
select 'not_null_no_default', column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'leads'
  and is_nullable = 'NO' and column_default is null;

insert into diag
select 'trigger', tgname
from pg_trigger
where tgrelid = 'public.leads'::regclass and not tgisinternal;

-- სატესტო insert ზუსტად ისე, როგორც აპი აგზავნის (admin-ის JWT-ით)
set role authenticated;
set request.jwt.claims to '{"sub":"b9df8920-01c1-4a0f-af30-9fc3eba9b1b4","role":"authenticated"}';

do $$
declare
  new_id uuid;
begin
  begin
    insert into public.leads
      (full_name, phone, email, source, notes, priority, status, assigned_to, assigned_at)
    values
      ('__ტესტი აპიდან__', '+995500000000', null, 'შემომავალი ზარი', null,
       'medium', 'new', 'b9df8920-01c1-4a0f-af30-9fc3eba9b1b4', now())
    returning id into new_id;
    insert into diag values ('test_insert_georgian_source', 'OK id=' || new_id);
    delete from public.leads where id = new_id;
  exception when others then
    insert into diag values ('test_insert_georgian_source', 'ERROR: ' || sqlerrm);
  end;

  begin
    insert into public.leads
      (full_name, phone, email, source, notes, priority, status, assigned_to, assigned_at)
    values
      ('__ტესტი აპიდან 2__', '+995500000001', null, 'mobile_app', null,
       'medium', 'new', 'b9df8920-01c1-4a0f-af30-9fc3eba9b1b4', now())
    returning id into new_id;
    insert into diag values ('test_insert_mobile_app_source', 'OK id=' || new_id);
    delete from public.leads where id = new_id;
  exception when others then
    insert into diag values ('test_insert_mobile_app_source', 'ERROR: ' || sqlerrm);
  end;
end $$;

reset role;

select step, info from diag order by step;
