-- ცოცხალი ბაზის პოლისების სრული დეფინიციები + get_my_role ფუნქცია
select json_build_object(
  'policies', (
    select json_agg(json_build_object(
      'table', tablename, 'name', policyname, 'cmd', cmd,
      'roles', roles, 'using', qual, 'check', with_check
    ) order by tablename, cmd)
    from pg_policies
    where schemaname = 'public'
      and tablename in ('leads','tasks','booking_requests','notifications',
                        'apartments','lead_notes','lead_apartment_interests','profiles')
  ),
  'get_my_role_src', (
    select prosrc from pg_proc
    where pronamespace = 'public'::regnamespace and proname = 'get_my_role'
    limit 1
  )
) as result;
