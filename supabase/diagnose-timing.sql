-- ═══════════════════════════════════════════════════════════════════════
-- ტაიმინგ-ტესტი: აპის მოთხოვნები authenticated როლით (admin-ის JWT-ით)
-- ზუსტად ის query-ები, რასაც აპი უშვებს — RLS-ის რეალური ღირებულებით.
-- ═══════════════════════════════════════════════════════════════════════

set role authenticated;
set request.jwt.claims to '{"sub":"b9df8920-01c1-4a0f-af30-9fc3eba9b1b4","role":"authenticated"}';

create temp table timing(step text, ms numeric);

do $$
declare
  t0 timestamptz;
  procedure_result record;
begin
  -- 1. როლის ფუნქცია ცალკე
  t0 := clock_timestamp();
  perform public.mobile_get_role();
  insert into timing values ('1_mobile_get_role', round(extract(epoch from clock_timestamp()-t0)*1000, 1));

  -- 2. ლიდების სია (200)
  t0 := clock_timestamp();
  perform * from public.leads order by created_at desc limit 200;
  insert into timing values ('2_leads_list_200', round(extract(epoch from clock_timestamp()-t0)*1000, 1));

  -- 3. ლიდების count ერთ სტატუსზე (dashboard x7)
  t0 := clock_timestamp();
  perform count(*) from public.leads where status = 'new';
  insert into timing values ('3_leads_count_new', round(extract(epoch from clock_timestamp()-t0)*1000, 1));

  -- 4. დავალებები ლიდის join-ით
  t0 := clock_timestamp();
  perform t.*, l.full_name from public.tasks t left join public.leads l on l.id = t.lead_id;
  insert into timing values ('4_tasks_join', round(extract(epoch from clock_timestamp()-t0)*1000, 1));

  -- 5. ჯავშნები join-ებით
  t0 := clock_timestamp();
  perform b.*, a.code, l.full_name
  from public.booking_requests b
  left join public.apartments a on a.id = b.apartment_id
  left join public.leads l on l.id = b.lead_id;
  insert into timing values ('5_bookings_join', round(extract(epoch from clock_timestamp()-t0)*1000, 1));

  -- 6. ბინები ბლოკი/სართულით
  t0 := clock_timestamp();
  perform a.*, bl.name, f.number
  from public.apartments a
  left join public.blocks bl on bl.id = a.block_id
  left join public.floors f on f.id = a.floor_id;
  insert into timing values ('6_apartments_join', round(extract(epoch from clock_timestamp()-t0)*1000, 1));

  -- 7. წაუკითხავი შეტყობინებები (ზარის ბეჯი)
  t0 := clock_timestamp();
  perform count(*) from public.notifications where is_read = false;
  insert into timing values ('7_notif_unread', round(extract(epoch from clock_timestamp()-t0)*1000, 1));

  -- 8. პროფილები (გუნდი)
  t0 := clock_timestamp();
  perform * from public.profiles;
  insert into timing values ('8_profiles_all', round(extract(epoch from clock_timestamp()-t0)*1000, 1));

  -- 9. ანალიტიკის დიდი select (5000 ლიმიტით)
  t0 := clock_timestamp();
  perform status, source, created_at, loss_reason from public.leads limit 5000;
  insert into timing values ('9_analytics_leads', round(extract(epoch from clock_timestamp()-t0)*1000, 1));
end $$;

select step, ms || ' ms' as duration from timing order by step;
