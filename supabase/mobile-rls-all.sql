-- ═══════════════════════════════════════════════════════════════════════
-- სიარემი მობილური — ყველა დარჩენილი წესი ერთად (ეტაპები 3–9)
--
-- ⭐ ეს არის ბოლო SQL, რომლის გაშვებაც მოგიწევს — ყველაფერი ერთადაა:
--    დავალებები, ჯავშნები, შეტყობინებები, პროფილები, პარამეტრები, ლოგები.
--
-- წინაპირობა: mobile-rls.sql და mobile-rls-write.sql უკვე გაშვებულია.
-- უსაფრთხოება: RLS-ს არ რთავს/თიშავს; მხოლოდ mobile_ წესები; re-run OK;
--              ვების ქცევა უცვლელი რჩება (service role წესებს გვერდს უვლის).
--
-- გაშვება: Supabase → SQL Editor → New query → ჩასვი მთლიანად → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ╔════════════════ ეტაპი 3 — დავალებები ════════════════╗

drop policy if exists mobile_insert_tasks on public.tasks;
create policy mobile_insert_tasks on public.tasks
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.mobile_get_role() <> 'inactive'
    and (
      public.mobile_get_role() in ('admin','director','sales_manager')
      or assigned_to = auth.uid()
      or assigned_to is null
    )
  );

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

drop policy if exists mobile_delete_tasks on public.tasks;
create policy mobile_delete_tasks on public.tasks
  for delete to authenticated
  using (
    created_by = auth.uid()
    or public.mobile_get_role() in ('admin','director')
  );

-- ╔════════════════ ეტაპი 4 — ჯავშნები ════════════════╗
-- მოთხოვნა: ყველას გარდა marketing-ისა (ვების canRequestBooking).
-- დამტკიცება/უარყოფა: მხოლოდ admin/director (ვების canApproveBooking).

drop policy if exists mobile_insert_bookings on public.booking_requests;
create policy mobile_insert_bookings on public.booking_requests
  for insert to authenticated
  with check (
    requested_by = auth.uid()
    and public.mobile_get_role() in ('admin','director','sales_manager','agent')
  );

drop policy if exists mobile_update_bookings on public.booking_requests;
create policy mobile_update_bookings on public.booking_requests
  for update to authenticated
  using (public.mobile_get_role() in ('admin','director'))
  with check (public.mobile_get_role() in ('admin','director'));

-- ჯავშნის დამტკიცების თანმხლები: ბინის სტატუსი — მხოლოდ admin/director
drop policy if exists mobile_update_apartments on public.apartments;
create policy mobile_update_apartments on public.apartments
  for update to authenticated
  using (public.mobile_get_role() in ('admin','director'))
  with check (public.mobile_get_role() in ('admin','director'));

-- შეტყობინების შექმნა სხვისთვის (ჯავშნის პასუხი) — მენეჯმენტი
drop policy if exists mobile_insert_notifications on public.notifications;
create policy mobile_insert_notifications on public.notifications
  for insert to authenticated
  with check (public.mobile_get_role() in ('admin','director','sales_manager'));

-- ╔════════════════ ეტაპი 5 — შეტყობინებები ════════════════╗
-- წაკითხულად მონიშვნა — მხოლოდ საკუთარი.

drop policy if exists mobile_update_notifications on public.notifications;
create policy mobile_update_notifications on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ╔════════════════ ეტაპი 8 — პროფილი ════════════════╗
-- საკუთარი პროფილის რედაქტირება (სახელი, ტელეფონი, push-პარამეტრები).
-- ⚠️ დამცავი ტრიგერი: არა-ადმინი საკუთარ role/is_active/manager_id-ს
--    ვერ შეიცვლის (პრივილეგიის აწევის საწინააღმდეგო). service role-ზე
--    (ვები) ტრიგერი არ მოქმედებს — auth.uid() იქ null-ია.

create or replace function public.mobile_guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new; -- სერვერული (service role) განახლებები უცვლელად გადის
  end if;
  if public.mobile_get_role() not in ('admin','director') then
    new.role       := old.role;
    new.is_active  := old.is_active;
    new.manager_id := old.manager_id;
  end if;
  return new;
end
$$;

drop trigger if exists mobile_guard_profile_update on public.profiles;
create trigger mobile_guard_profile_update
  before update on public.profiles
  for each row execute function public.mobile_guard_profile_update();

drop policy if exists mobile_update_profiles on public.profiles;
create policy mobile_update_profiles on public.profiles
  for update to authenticated
  using (
    id = auth.uid()
    or public.mobile_get_role() in ('admin','director')
  )
  with check (
    id = auth.uid()
    or public.mobile_get_role() in ('admin','director')
  );

-- ╔════════════════ ეტაპი 8 — პარამეტრები (features) ════════════════╗
-- ფუნქციების მატრიცის კითხვა (settings.role_features) — ყველა აქტიურს.

drop policy if exists mobile_read_settings on public.settings;
create policy mobile_read_settings on public.settings
  for select to authenticated
  using (public.mobile_get_role() <> 'inactive');

-- ╔════════════════ აქტივობის ლოგი ════════════════╗
-- აპი წერს საკუთარ ქმედებებს; კითხულობს მხოლოდ მენეჯმენტი.

drop policy if exists mobile_read_activity on public.activity_logs;
create policy mobile_read_activity on public.activity_logs
  for select to authenticated
  using (public.mobile_get_role() in ('admin','director','sales_manager'));

drop policy if exists mobile_insert_activity on public.activity_logs;
create policy mobile_insert_activity on public.activity_logs
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.mobile_get_role() <> 'inactive'
  );

-- ╔════════════════ შედეგი — ყველა mobile_ წესი ════════════════╗

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and policyname like 'mobile_%'
order by tablename, cmd, policyname;
