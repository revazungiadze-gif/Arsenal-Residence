-- ═══════════════════════════════════════════════════════════════════════
-- სიარემი მობილური — RLS კითხვის წესები (ეტაპი 1)
--
-- რას აკეთებს: ავტორიზებულ თანამშრომელს აძლევს მონაცემების კითხვის
-- უფლებას როლის მიხედვით — ზუსტად ვებ-CRM-ის ლოგიკით.
--
-- უსაფრთხოება:
--   • RLS-ს არსად არ რთავს/თიშავს — ვების ქცევა უცვლელი რჩება
--   • მხოლოდ SELECT (კითხვა) — ჩაწერის წესები ეტაპ 2-ზე დაემატება
--   • ყველა წესს აქვს mobile_ პრეფიქსი — არსებულ წესებს არ ეხება
--   • ხელახლა გაშვება უსაფრთხოა (drop if exists → create)
--
-- გაშვება: Supabase → SQL Editor → New query → ჩასვი მთლიანად → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. როლის ფუნქცია ──────────────────────────────────────────────────
-- security definer = RLS-ის გვერდის ავლით კითხულობს profiles-ს
-- (თორემ profiles-ის წესი საკუთარ თავს დაუძახებდა — რეკურსია).
-- legacy როლების fallback ვების rbac.ts-ის იდენტურია; უცნობი → marketing.
create or replace function public.mobile_get_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select case
       when not coalesce(p.is_active, true) then 'inactive'
       when p.role in ('admin','director','sales_manager','agent','marketing') then p.role
       when p.role = 'viewer'  then 'marketing'
       when p.role = 'sales'   then 'agent'
       when p.role = 'manager' then 'sales_manager'
       else 'marketing'
     end
     from public.profiles p
     where p.id = auth.uid()),
    'inactive');
$$;

grant execute on function public.mobile_get_role() to authenticated;

-- ── 2. profiles — საკუთარი პროფილი ყველას; სრული სია მენეჯმენტს ───────
drop policy if exists mobile_read_profiles on public.profiles;
create policy mobile_read_profiles on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.mobile_get_role() in ('admin','director','sales_manager')
  );

-- ── 3. leads — მენეჯმენტი: ყველა; agent: მხოლოდ საკუთარი; marketing: არა ─
drop policy if exists mobile_read_leads on public.leads;
create policy mobile_read_leads on public.leads
  for select to authenticated
  using (
    public.mobile_get_role() in ('admin','director','sales_manager')
    or (public.mobile_get_role() = 'agent' and assigned_to = auth.uid())
  );

-- ── 4. lead_notes — ჩანს, თუ მშობელი ლიდი ჩანს ────────────────────────
drop policy if exists mobile_read_lead_notes on public.lead_notes;
create policy mobile_read_lead_notes on public.lead_notes
  for select to authenticated
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_notes.lead_id
        and (
          public.mobile_get_role() in ('admin','director','sales_manager')
          or (public.mobile_get_role() = 'agent' and l.assigned_to = auth.uid())
        )
    )
  );

-- ── 5. lead_apartment_interests — იგივე ლოგიკა ────────────────────────
drop policy if exists mobile_read_lead_interests on public.lead_apartment_interests;
create policy mobile_read_lead_interests on public.lead_apartment_interests
  for select to authenticated
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_apartment_interests.lead_id
        and (
          public.mobile_get_role() in ('admin','director','sales_manager')
          or (public.mobile_get_role() = 'agent' and l.assigned_to = auth.uid())
        )
    )
  );

-- ── 6. tasks — მენეჯმენტი: ყველა; სხვები: საკუთარი/თვითშექმნილი ───────
drop policy if exists mobile_read_tasks on public.tasks;
create policy mobile_read_tasks on public.tasks
  for select to authenticated
  using (
    public.mobile_get_role() in ('admin','director','sales_manager')
    or assigned_to = auth.uid()
    or created_by  = auth.uid()
  );

-- ── 7. notifications — ყველას მხოლოდ საკუთარი ─────────────────────────
drop policy if exists mobile_read_notifications on public.notifications;
create policy mobile_read_notifications on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

-- ── 8. booking_requests — მენეჯმენტი: ყველა; სხვები: საკუთარი ─────────
drop policy if exists mobile_read_bookings on public.booking_requests;
create policy mobile_read_bookings on public.booking_requests
  for select to authenticated
  using (
    public.mobile_get_role() in ('admin','director','sales_manager')
    or requested_by = auth.uid()
  );

-- ── 9. ინვენტარი — ყველა აქტიურ თანამშრომელს (კითხვა) ─────────────────
drop policy if exists mobile_read_apartments on public.apartments;
create policy mobile_read_apartments on public.apartments
  for select to authenticated
  using (public.mobile_get_role() <> 'inactive');

drop policy if exists mobile_read_blocks on public.blocks;
create policy mobile_read_blocks on public.blocks
  for select to authenticated
  using (public.mobile_get_role() <> 'inactive');

drop policy if exists mobile_read_floors on public.floors;
create policy mobile_read_floors on public.floors
  for select to authenticated
  using (public.mobile_get_role() <> 'inactive');

drop policy if exists mobile_read_apartment_images on public.apartment_images;
create policy mobile_read_apartment_images on public.apartment_images
  for select to authenticated
  using (public.mobile_get_role() <> 'inactive');

-- ── 10. შედეგის შემოწმება — რა წესები შეიქმნა ─────────────────────────
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and policyname like 'mobile_%'
order by tablename;
