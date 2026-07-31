-- გაუმჯობესებული ძებნა: ვების ლიდი (Elya Makeeva / 595208769) ამ ბაზაშია თუ არა
-- 1) ტელეფონი ციფრების ნორმალიზებით (ფორმატი აღარ გვიშლის ხელს)
-- 2) სახელით ძებნა leads-ში
-- 3) leads ცხრილის სრული სვეტების სია (არქივის/ბაზის ველების აღმოსაჩენად)
-- 4) ლიდების განაწილება მინიჭების მიხედვით

select json_build_object(
  'phone_in_leads', (
    select coalesce(json_agg(json_build_object(
      'name', full_name, 'phone', phone, 'status', status,
      'assigned_to', assigned_to, 'created', created_at, 'updated', updated_at
    )), '[]'::json)
    from public.leads
    where regexp_replace(coalesce(phone,''), '\D', '', 'g') like '%595208769%'
  ),
  'name_in_leads', (
    select coalesce(json_agg(json_build_object(
      'name', full_name, 'phone', phone, 'created', created_at
    )), '[]'::json)
    from public.leads
    where full_name ilike '%makeeva%' or full_name ilike '%elya%'
       or full_name ilike '%turmanauli%' or full_name ilike '%mushkudiani%'
  ),
  'leads_columns', (
    select json_agg(column_name order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'leads'
  ),
  'by_assignee', (
    select json_agg(t) from (
      select coalesce(p.full_name, 'მიუნიჭებელი') as agent,
             count(*) as total,
             count(*) filter (where l.status not in ('won','lost')) as active
      from public.leads l
      left join public.profiles p on p.id = l.assigned_to
      group by 1 order by 2 desc
    ) t
  )
) as result;
