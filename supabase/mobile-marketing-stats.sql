-- ═══════════════════════════════════════════════════════════════════════
-- მარკეტინგის აგრეგატები (ეტაპი 7 დამატება) — PII-ის გარეშე
--
-- marketing როლი ლიდებს ვერ კითხულობს (RLS, ვების rbac-ის სარკე), მაგრამ
-- ვებში მარკეტინგის დეშბორდები აგრეგატებს უჩვენებს. ეს ფუნქცია იმავეს
-- აძლევს მობილურს: მხოლოდ რიცხვები — არც სახელი, არც ტელეფონი.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.mobile_marketing_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.mobile_get_role() = 'inactive' then null
    else json_build_object(
      'total', (select count(*) from leads),
      'won',   (select count(*) from leads where status = 'won'),
      'lost',  (select count(*) from leads where status = 'lost'),
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
          from leads where status = 'lost'
          group by 1 order by c desc limit 6
        ) r
      )
    )
  end;
$$;

revoke all on function public.mobile_marketing_stats() from public;
grant execute on function public.mobile_marketing_stats() to authenticated;

select 'mobile_marketing_stats created' as result;
