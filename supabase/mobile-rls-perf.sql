-- ═══════════════════════════════════════════════════════════════════════
-- წარმადობის ოპტიმიზაცია — RLS წესები + ინდექსები
--
-- პრობლემა: mobile_get_role()/auth.uid() წესებში ყოველ მწკრივზე
-- სრულდებოდა (54 ათასობით გამოძახება დიდ ცხრილებზე → 10-20წმ ჩატვირთვა).
-- გასწორება: (select fn()) ფორმა — Postgres-ის InitPlan, სრულდება
-- ერთხელ მთელ მოთხოვნაზე. + ინდექსები ხშირ ფილტრებზე.
--
-- ყველა წესი იგივე ლოგიკით იქმნება თავიდან — უფლებები არ იცვლება.
-- ═══════════════════════════════════════════════════════════════════════

-- ── ინდექსები ─────────────────────────────────────────────────────────
create index if not exists idx_leads_assigned_to on public.leads(assigned_to);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_lead_notes_lead_id on public.lead_notes(lead_id);
create index if not exists idx_lead_interests_lead_id on public.lead_apartment_interests(lead_id);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_created_by on public.tasks(created_by);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);
create index if not exists idx_bookings_status on public.booking_requests(status);
create index if not exists idx_bookings_requested_by on public.booking_requests(requested_by);
create index if not exists idx_bookings_reviewed_at on public.booking_requests(reviewed_at);
create index if not exists idx_apartments_status on public.apartments(status);

-- ── SELECT წესები (ოპტიმიზებული) ──────────────────────────────────────

drop policy if exists mobile_read_profiles on public.profiles;
create policy mobile_read_profiles on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.mobile_get_role()) in ('admin','director','sales_manager')
  );

drop policy if exists mobile_read_leads on public.leads;
create policy mobile_read_leads on public.leads
  for select to authenticated
  using (
    (select public.mobile_get_role()) in ('admin','director','sales_manager')
    or ((select public.mobile_get_role()) = 'agent' and assigned_to = (select auth.uid()))
  );

drop policy if exists mobile_read_lead_notes on public.lead_notes;
create policy mobile_read_lead_notes on public.lead_notes
  for select to authenticated
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_notes.lead_id
        and (
          (select public.mobile_get_role()) in ('admin','director','sales_manager')
          or ((select public.mobile_get_role()) = 'agent' and l.assigned_to = (select auth.uid()))
        )
    )
  );

drop policy if exists mobile_read_lead_interests on public.lead_apartment_interests;
create policy mobile_read_lead_interests on public.lead_apartment_interests
  for select to authenticated
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_apartment_interests.lead_id
        and (
          (select public.mobile_get_role()) in ('admin','director','sales_manager')
          or ((select public.mobile_get_role()) = 'agent' and l.assigned_to = (select auth.uid()))
        )
    )
  );

drop policy if exists mobile_read_tasks on public.tasks;
create policy mobile_read_tasks on public.tasks
  for select to authenticated
  using (
    (select public.mobile_get_role()) in ('admin','director','sales_manager')
    or assigned_to = (select auth.uid())
    or created_by  = (select auth.uid())
  );

drop policy if exists mobile_read_notifications on public.notifications;
create policy mobile_read_notifications on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists mobile_read_bookings on public.booking_requests;
create policy mobile_read_bookings on public.booking_requests
  for select to authenticated
  using (
    (select public.mobile_get_role()) in ('admin','director','sales_manager')
    or requested_by = (select auth.uid())
  );

drop policy if exists mobile_read_apartments on public.apartments;
create policy mobile_read_apartments on public.apartments
  for select to authenticated
  using ((select public.mobile_get_role()) <> 'inactive');

drop policy if exists mobile_read_blocks on public.blocks;
create policy mobile_read_blocks on public.blocks
  for select to authenticated
  using ((select public.mobile_get_role()) <> 'inactive');

drop policy if exists mobile_read_floors on public.floors;
create policy mobile_read_floors on public.floors
  for select to authenticated
  using ((select public.mobile_get_role()) <> 'inactive');

drop policy if exists mobile_read_apartment_images on public.apartment_images;
create policy mobile_read_apartment_images on public.apartment_images
  for select to authenticated
  using ((select public.mobile_get_role()) <> 'inactive');

drop policy if exists mobile_read_settings on public.settings;
create policy mobile_read_settings on public.settings
  for select to authenticated
  using ((select public.mobile_get_role()) <> 'inactive');

drop policy if exists mobile_read_activity on public.activity_logs;
create policy mobile_read_activity on public.activity_logs
  for select to authenticated
  using ((select public.mobile_get_role()) in ('admin','director','sales_manager'));

-- ── ჩაწერის წესები (ოპტიმიზებული) ─────────────────────────────────────

drop policy if exists mobile_insert_leads on public.leads;
create policy mobile_insert_leads on public.leads
  for insert to authenticated
  with check (
    (select public.mobile_get_role()) in ('admin','director','sales_manager')
    or ((select public.mobile_get_role()) = 'agent' and assigned_to = (select auth.uid()))
  );

drop policy if exists mobile_update_leads on public.leads;
create policy mobile_update_leads on public.leads
  for update to authenticated
  using (
    (select public.mobile_get_role()) in ('admin','director','sales_manager')
    or ((select public.mobile_get_role()) = 'agent' and assigned_to = (select auth.uid()))
  )
  with check (
    (select public.mobile_get_role()) in ('admin','director','sales_manager')
    or ((select public.mobile_get_role()) = 'agent' and assigned_to = (select auth.uid()))
  );

drop policy if exists mobile_insert_lead_notes on public.lead_notes;
create policy mobile_insert_lead_notes on public.lead_notes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.leads l
      where l.id = lead_notes.lead_id
        and (
          (select public.mobile_get_role()) in ('admin','director','sales_manager')
          or ((select public.mobile_get_role()) = 'agent' and l.assigned_to = (select auth.uid()))
        )
    )
  );

drop policy if exists mobile_delete_lead_notes on public.lead_notes;
create policy mobile_delete_lead_notes on public.lead_notes
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.mobile_get_role()) in ('admin','director')
  );

drop policy if exists mobile_insert_lead_interests on public.lead_apartment_interests;
create policy mobile_insert_lead_interests on public.lead_apartment_interests
  for insert to authenticated
  with check (
    exists (
      select 1 from public.leads l
      where l.id = lead_apartment_interests.lead_id
        and (
          (select public.mobile_get_role()) in ('admin','director','sales_manager')
          or ((select public.mobile_get_role()) = 'agent' and l.assigned_to = (select auth.uid()))
        )
    )
  );

drop policy if exists mobile_delete_lead_interests on public.lead_apartment_interests;
create policy mobile_delete_lead_interests on public.lead_apartment_interests
  for delete to authenticated
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_apartment_interests.lead_id
        and (
          (select public.mobile_get_role()) in ('admin','director','sales_manager')
          or ((select public.mobile_get_role()) = 'agent' and l.assigned_to = (select auth.uid()))
        )
    )
  );

drop policy if exists mobile_insert_tasks on public.tasks;
create policy mobile_insert_tasks on public.tasks
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.mobile_get_role()) <> 'inactive'
    and (
      (select public.mobile_get_role()) in ('admin','director','sales_manager')
      or assigned_to = (select auth.uid())
      or assigned_to is null
    )
  );

drop policy if exists mobile_update_tasks on public.tasks;
create policy mobile_update_tasks on public.tasks
  for update to authenticated
  using (
    (select public.mobile_get_role()) in ('admin','director','sales_manager')
    or assigned_to = (select auth.uid())
    or created_by  = (select auth.uid())
  )
  with check (
    (select public.mobile_get_role()) in ('admin','director','sales_manager')
    or assigned_to = (select auth.uid())
    or created_by  = (select auth.uid())
  );

drop policy if exists mobile_delete_tasks on public.tasks;
create policy mobile_delete_tasks on public.tasks
  for delete to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.mobile_get_role()) in ('admin','director')
  );

drop policy if exists mobile_insert_bookings on public.booking_requests;
create policy mobile_insert_bookings on public.booking_requests
  for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and (select public.mobile_get_role()) in ('admin','director','sales_manager','agent')
  );

drop policy if exists mobile_update_bookings on public.booking_requests;
create policy mobile_update_bookings on public.booking_requests
  for update to authenticated
  using ((select public.mobile_get_role()) in ('admin','director'))
  with check ((select public.mobile_get_role()) in ('admin','director'));

drop policy if exists mobile_update_apartments on public.apartments;
create policy mobile_update_apartments on public.apartments
  for update to authenticated
  using ((select public.mobile_get_role()) in ('admin','director'))
  with check ((select public.mobile_get_role()) in ('admin','director'));

drop policy if exists mobile_insert_notifications on public.notifications;
create policy mobile_insert_notifications on public.notifications
  for insert to authenticated
  with check ((select public.mobile_get_role()) in ('admin','director','sales_manager'));

drop policy if exists mobile_update_notifications on public.notifications;
create policy mobile_update_notifications on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists mobile_update_profiles on public.profiles;
create policy mobile_update_profiles on public.profiles
  for update to authenticated
  using (
    id = (select auth.uid())
    or (select public.mobile_get_role()) in ('admin','director')
  )
  with check (
    id = (select auth.uid())
    or (select public.mobile_get_role()) in ('admin','director')
  );

drop policy if exists mobile_insert_activity on public.activity_logs;
create policy mobile_insert_activity on public.activity_logs
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.mobile_get_role()) <> 'inactive'
  );

-- ── შედეგი ────────────────────────────────────────────────────────────
select count(*)::int as mobile_policies
from pg_policies
where schemaname = 'public' and policyname like 'mobile_%';
