-- სად არის "gio test" ლიდი და რით განსხვავდება ვების ლიდებისგან
select json_build_object(
  'gio_test', (
    select coalesce(json_agg(json_build_object(
      'id', l.id,
      'full_name', l.full_name,
      'status', l.status,
      'source', l.source,
      'assigned_to', l.assigned_to,
      'assigned_name', p.full_name,
      'assigned_role', p.role,
      'created_at', l.created_at
    )), '[]'::json)
    from public.leads l
    left join public.profiles p on p.id = l.assigned_to
    where l.full_name ilike '%gio%test%' or l.full_name ilike '%gio test%'
  ),
  'latest_5_leads', (
    select json_agg(t) from (
      select full_name, status, source, assigned_to, created_at
      from public.leads
      order by created_at desc
      limit 5
    ) t
  )
) as result;
