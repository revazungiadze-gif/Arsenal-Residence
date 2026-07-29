-- ═══════════════════════════════════════════════════════════════════════
-- ეტაპი 5 — realtime-ის ჩართვა notifications ცხრილზე
-- (რომ ახალი შეტყობინება აპში წამიერად ჩავარდეს, გვერდის განახლების გარეშე)
-- უსაფრთხოა: მხოლოდ პუბლიკაციას ამატებს; RLS realtime-ზეც მოქმედებს.
-- ═══════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- შემოწმება
select pubname, schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by tablename;
