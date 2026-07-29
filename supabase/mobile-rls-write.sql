-- ═══════════════════════════════════════════════════════════════════════
-- სიარემი მობილური — ჩაწერის წესები (ეტაპი 2)
--
-- წინაპირობა: ჯერ გაშვებული უნდა იყოს mobile-rls.sql (ეტაპი 1).
--
-- როლების ლოგიკა (ვებ-CRM-ის rbac.ts-ის სარკე):
--   • ლიდის შექმნა/რედაქტირება: admin, director, sales_manager — ყველა;
--     agent — მხოლოდ საკუთარი (და საკუთარზე მიბმული უნდა დარჩეს);
--     marketing — ვერაფერს წერს.
--   • შენიშვნა: ვისაც ლიდი უჩანს, იმას შეუძლია დაამატოს (ავტორად თავად).
--   • წაშლა ამ ეტაპზე არ ირთვება (მხოლოდ საკუთარი შენიშვნის წაშლა).
--
-- უსაფრთხოება: RLS-ს არ რთავს/თიშავს; მხოლოდ mobile_ წესები; re-run OK.
-- გაშვება: Supabase → SQL Editor → New query → ჩასვი → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. leads — შექმნა ─────────────────────────────────────────────────
drop policy if exists mobile_insert_leads on public.leads;
create policy mobile_insert_leads on public.leads
  for insert to authenticated
  with check (
    public.mobile_get_role() in ('admin','director','sales_manager')
    or (public.mobile_get_role() = 'agent' and assigned_to = auth.uid())
  );

-- ── 2. leads — რედაქტირება (სტატუსი, პრიორიტეტი, მინიჭება...) ─────────
-- agent-ის with check ითხოვს assigned_to = auth.uid() — ანუ აგენტი ვერ
-- გადაამისამართებს ლიდს სხვაზე (ეს მხოლოდ მენეჯმენტს შეუძლია).
drop policy if exists mobile_update_leads on public.leads;
create policy mobile_update_leads on public.leads
  for update to authenticated
  using (
    public.mobile_get_role() in ('admin','director','sales_manager')
    or (public.mobile_get_role() = 'agent' and assigned_to = auth.uid())
  )
  with check (
    public.mobile_get_role() in ('admin','director','sales_manager')
    or (public.mobile_get_role() = 'agent' and assigned_to = auth.uid())
  );

-- ── 3. lead_notes — დამატება (ავტორად მხოლოდ საკუთარი თავი) ───────────
drop policy if exists mobile_insert_lead_notes on public.lead_notes;
create policy mobile_insert_lead_notes on public.lead_notes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.leads l
      where l.id = lead_notes.lead_id
        and (
          public.mobile_get_role() in ('admin','director','sales_manager')
          or (public.mobile_get_role() = 'agent' and l.assigned_to = auth.uid())
        )
    )
  );

-- ── 4. lead_notes — საკუთარი შენიშვნის წაშლა ──────────────────────────
drop policy if exists mobile_delete_lead_notes on public.lead_notes;
create policy mobile_delete_lead_notes on public.lead_notes
  for delete to authenticated
  using (
    user_id = auth.uid()
    or public.mobile_get_role() in ('admin','director')
  );

-- ── 5. lead_apartment_interests — დამატება/წაშლა ─────────────────────
drop policy if exists mobile_insert_lead_interests on public.lead_apartment_interests;
create policy mobile_insert_lead_interests on public.lead_apartment_interests
  for insert to authenticated
  with check (
    exists (
      select 1 from public.leads l
      where l.id = lead_apartment_interests.lead_id
        and (
          public.mobile_get_role() in ('admin','director','sales_manager')
          or (public.mobile_get_role() = 'agent' and l.assigned_to = auth.uid())
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
          public.mobile_get_role() in ('admin','director','sales_manager')
          or (public.mobile_get_role() = 'agent' and l.assigned_to = auth.uid())
        )
    )
  );

-- ── 6. შედეგის შემოწმება ──────────────────────────────────────────────
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and policyname like 'mobile_%'
  and cmd <> 'SELECT'
order by tablename, cmd;
