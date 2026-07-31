-- ბოლო შემოწმებები სინქრონამდე:
-- 1) lead_notes სვეტები (აპი user_id+author_id-ს აგზავნის)
-- 2) profiles-ის ტრიგერები (როლის დაცვა არსებობს თუ არა)
-- 3) realtime პუბლიკაციის შემადგენლობა
select json_build_object(
  'lead_notes_columns', (
    select json_agg(column_name order by ordinal_position)
    from information_schema.columns
    where table_schema='public' and table_name='lead_notes'
  ),
  'profiles_triggers', (
    select coalesce(json_agg(tgname), '[]'::json)
    from pg_trigger
    where tgrelid = 'public.profiles'::regclass and not tgisinternal
  ),
  'realtime_tables', (
    select coalesce(json_agg(tablename), '[]'::json)
    from pg_publication_tables
    where pubname = 'supabase_realtime'
  ),
  'tasks_columns', (
    select json_agg(column_name order by ordinal_position)
    from information_schema.columns
    where table_schema='public' and table_name='tasks'
  )
) as result;
