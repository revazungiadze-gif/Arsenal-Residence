-- ═══════════════════════════════════════════════════════════════════
-- ეტაპი 1 / ნაბიჯი 1 — RLS დიაგნოსტიკა (მხოლოდ კითხულობს, არაფერს ცვლის)
-- გაუშვი: Supabase → SQL Editor → New query → ჩასვი → Run
-- შედეგი მთლიანად დააკოპირე და ჩატში ჩასვი.
-- ═══════════════════════════════════════════════════════════════════

select 'A_table' as kind,
       c.relname   as name,
       c.relrowsecurity::text as detail1,   -- true = RLS ჩართულია
       ''          as detail2,
       ''          as detail3
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'

union all

select 'B_policy',
       p.tablename,
       p.policyname,
       p.cmd,                               -- SELECT/INSERT/UPDATE/DELETE/ALL
       array_to_string(p.roles, ',')        -- ვისზე ვრცელდება
from pg_policies p
where p.schemaname = 'public'

union all

select 'C_function',
       p.proname,
       case when p.prosecdef then 'security_definer' else 'invoker' end,
       '',
       ''
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_my_role')

order by 1, 2, 3;
