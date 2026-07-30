-- ═══════════════════════════════════════════════════════════════════════
-- mobile_dashboard_counts() — დეშბორდის ყველა მრიცხველი ერთ მოთხოვნაში.
-- security invoker (ნაგულისხმევი) → RLS მოქმედებს: აგენტი მხოლოდ თავის
-- ლიდებს ითვლის, მენეჯმენტი — ყველას. 10 HTTP მოთხოვნის ნაცვლად 1.
-- იდემპოტენტურია.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.mobile_dashboard_counts()
returns json
language sql
stable
as $$
  select json_build_object(
    'leads', coalesce(
      (select json_object_agg(t.status, t.c)
       from (select status, count(*)::int as c
             from public.leads
             group by status) t),
      '{}'::json
    ),
    'apartments', coalesce(
      (select json_object_agg(t.status, t.c)
       from (select status, count(*)::int as c
             from public.apartments
             group by status) t),
      '{}'::json
    )
  );
$$;

grant execute on function public.mobile_dashboard_counts() to authenticated;

-- შემოწმება
select public.mobile_dashboard_counts();
