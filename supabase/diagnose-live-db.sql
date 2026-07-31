-- ცოცხალი (EU) ბაზის ვერიფიკაცია: ვების მონაცემები აქ არის თუ არა
select json_build_object(
  'leads_total', (select count(*) from public.leads),
  'elya_present', (
    select count(*) from public.leads
    where full_name ilike '%makeeva%'
       or regexp_replace(coalesce(phone,''), '\D', '', 'g') like '%595208769%'
  ),
  'latest_3', (
    select json_agg(t) from (
      select full_name, status, source, created_at
      from public.leads order by created_at desc limit 3
    ) t
  ),
  'tables', (
    select json_agg(table_name order by table_name)
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
  ),
  'roles_in_use', (
    select json_agg(t) from (
      select role, count(*) from public.profiles group by role
    ) t
  ),
  'rls_disabled_tables', (
    select coalesce(json_agg(relname), '[]'::json)
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relkind = 'r' and not relrowsecurity
  )
) as result;
