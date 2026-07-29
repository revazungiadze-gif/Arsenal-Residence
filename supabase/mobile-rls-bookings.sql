-- ═══════════════════════════════════════════════════════════════════════
-- ეტაპი 4 დამატება — ჯავშნის დამტკიცების თანმხლები წესები
-- (ბინის სტატუსის ცვლა + შეტყობინების შექმნა — ვების ლოგიკის სარკე)
-- ═══════════════════════════════════════════════════════════════════════

-- ბინის სტატუსის ცვლა (available/reserved/sold) — მხოლოდ admin/director
drop policy if exists mobile_update_apartments on public.apartments;
create policy mobile_update_apartments on public.apartments
  for update to authenticated
  using (public.mobile_get_role() in ('admin','director'))
  with check (public.mobile_get_role() in ('admin','director'));

-- შეტყობინების შექმნა სხვისთვის (ჯავშნის პასუხი და ა.შ.) — მენეჯმენტი
drop policy if exists mobile_insert_notifications on public.notifications;
create policy mobile_insert_notifications on public.notifications
  for insert to authenticated
  with check (public.mobile_get_role() in ('admin','director','sales_manager'));

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and policyname in ('mobile_update_apartments','mobile_insert_notifications');
