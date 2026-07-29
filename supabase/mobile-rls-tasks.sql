-- ═══════════════════════════════════════════════════════════════════════
-- სიარემი მობილური — დავალებების ჩაწერის წესები (ეტაპი 3)
--
-- წინაპირობა: mobile-rls.sql (ეტაპი 1) გაშვებული უნდა იყოს.
-- ლოგიკა: მენეჯმენტი ყველა დავალებას მართავს; დანარჩენები — მხოლოდ
-- საკუთარს (თავად შექმნილს ან მათზე მინიჭებულს). marketing-საც შეუძლია
-- საკუთარი დავალებები (ვების ლოგიკის შესაბამისად ლიდებს ვერ ხედავს,
-- მაგრამ task-ები აქვს).
--
-- უსაფრთხოება: RLS-ს არ რთავს/თიშავს; მხოლოდ mobile_ წესები; re-run OK.
-- გაშვება: Supabase → SQL Editor → New query → ჩასვი → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. tasks — შექმნა (შემქმნელი ყოველთვის საკუთარი თავი) ─────────────
drop policy if exists mobile_insert_tasks on public.tasks;
create policy mobile_insert_tasks on public.tasks
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.mobile_get_role() <> 'inactive'
    -- მინიჭება სხვაზე მხოლოდ მენეჯმენტს შეუძლია
    and (
      public.mobile_get_role() in ('admin','director','sales_manager')
      or assigned_to = auth.uid()
      or assigned_to is null
    )
  );

-- ── 2. tasks — რედაქტირება (დასრულება/სტატუსი) ────────────────────────
drop policy if exists mobile_update_tasks on public.tasks;
create policy mobile_update_tasks on public.tasks
  for update to authenticated
  using (
    public.mobile_get_role() in ('admin','director','sales_manager')
    or assigned_to = auth.uid()
    or created_by  = auth.uid()
  )
  with check (
    public.mobile_get_role() in ('admin','director','sales_manager')
    or assigned_to = auth.uid()
    or created_by  = auth.uid()
  );

-- ── 3. tasks — წაშლა (მხოლოდ შემქმნელი ან ადმინი/დირექტორი) ───────────
drop policy if exists mobile_delete_tasks on public.tasks;
create policy mobile_delete_tasks on public.tasks
  for delete to authenticated
  using (
    created_by = auth.uid()
    or public.mobile_get_role() in ('admin','director')
  );

-- ── 4. შედეგის შემოწმება ──────────────────────────────────────────────
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'tasks'
  and policyname like 'mobile_%'
order by cmd;
