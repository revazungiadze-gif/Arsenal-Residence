-- ═══════════════════════════════════════════════════════════════════════
-- სრული აუდიტი: CHECK-შეზღუდვები + RLS სტატუსი + ცოცხალი ჩაწერის ტესტები
-- ყველა ცხრილზე, რომელზეც აპი წერს. ტესტ-რიგები ბოლოს იწმინდება.
-- ═══════════════════════════════════════════════════════════════════════

create temp table diag(step text, info text);
grant all on diag to authenticated;

-- 1) CHECK-შეზღუდვები app-ის ცხრილებზე
insert into diag
select c.conrelid::regclass::text || ' » ' || c.conname, pg_get_constraintdef(c.oid)
from pg_constraint c
where c.contype = 'c'
  and c.conrelid::regclass::text in
    ('leads','tasks','booking_requests','notifications','apartments',
     'lead_notes','lead_apartment_interests','profiles');

-- 2) RLS ჩართულობა
insert into diag
select 'rls_enabled » ' || relname, relrowsecurity::text
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in
    ('leads','tasks','booking_requests','notifications','apartments',
     'lead_notes','lead_apartment_interests','profiles','apartment_images',
     'blocks','floors');

-- 3) პოლისების რაოდენობა ცხრილი+ბრძანების ჭრილში
insert into diag
select 'policies » ' || tablename || ' ' || cmd, count(*)::text
from pg_policies
where schemaname = 'public'
  and tablename in
    ('leads','tasks','booking_requests','notifications','apartments',
     'lead_notes','lead_apartment_interests','profiles')
group by tablename, cmd;

-- 4) ცოცხალი ჩაწერის ტესტები admin-ის JWT-ით
set role authenticated;
set request.jwt.claims to '{"sub":"b9df8920-01c1-4a0f-af30-9fc3eba9b1b4","role":"authenticated"}';

do $$
declare
  uid uuid := 'b9df8920-01c1-4a0f-af30-9fc3eba9b1b4';
  tid uuid; nid uuid; bid uuid; iid uuid;
  apt uuid; ld uuid;
begin
  -- tasks: insert → сtatus ცვლა ორივე მნიშვნელობაზე → delete
  begin
    insert into public.tasks (title, status, priority, assigned_to, created_by)
    values ('__აუდიტი__', 'pending', 'medium', uid, uid) returning id into tid;
    update public.tasks set status = 'completed' where id = tid;
    update public.tasks set status = 'cancelled' where id = tid;
    delete from public.tasks where id = tid;
    insert into diag values ('test » tasks flow', 'OK');
  exception when others then
    insert into diag values ('test » tasks flow', 'ERROR: ' || sqlerrm);
  end;

  -- notifications: ზუსტად ის ტიპები, რასაც reviewBooking აგზავნის
  begin
    insert into public.notifications (user_id, title, message, type)
    values (uid, '__აუდიტი__', 't', 'success') returning id into nid;
    insert into public.notifications (user_id, title, message, type)
    values (uid, '__აუდიტი__', 't', 'warning');
    insert into diag values ('test » notifications success/warning', 'OK');
  exception when others then
    insert into diag values ('test » notifications success/warning', 'ERROR: ' || sqlerrm);
  end;

  -- booking flow: available ბინაზე pending → rejected (მიზეზით)
  select id into apt from public.apartments where status = 'available' limit 1;
  select id into ld from public.leads limit 1;
  if apt is not null and ld is not null then
    begin
      insert into public.booking_requests (apartment_id, lead_id, requested_by, status, note)
      values (apt, ld, uid, 'pending', '__აუდიტი__') returning id into bid;
      update public.booking_requests
        set status = 'rejected', reject_reason = 'ტესტი', reviewed_by = uid, reviewed_at = now()
        where id = bid;
      insert into diag values ('test » booking pending→rejected', 'OK');
    exception when others then
      insert into diag values ('test » booking pending→rejected', 'ERROR: ' || sqlerrm);
    end;
    -- apartments: no-op სტატუსის განახლება (მონაცემი არ იცვლება)
    begin
      update public.apartments set status = status where id = apt;
      insert into diag values ('test » apartment status update', 'OK');
    exception when others then
      insert into diag values ('test » apartment status update', 'ERROR: ' || sqlerrm);
    end;
    -- ინტერესი: interested ტიპით
    begin
      insert into public.lead_apartment_interests (lead_id, apartment_id, apartment_code, interest_type)
      values (ld, apt, '__აუდიტი__', 'interested') returning id into iid;
      delete from public.lead_apartment_interests where id = iid;
      insert into diag values ('test » lead interest', 'OK');
    exception when others then
      insert into diag values ('test » lead interest', 'ERROR: ' || sqlerrm);
    end;
  else
    insert into diag values ('test » booking/interest', 'SKIP: available ბინა ან ლიდი ვერ მოიძებნა');
  end if;

  -- profiles: საკუთარი no-op განახლება
  begin
    update public.profiles set full_name = full_name where id = uid;
    insert into diag values ('test » own profile update', 'OK');
  exception when others then
    insert into diag values ('test » own profile update', 'ERROR: ' || sqlerrm);
  end;
end $$;

reset role;

-- 5) ტესტ-რიგების გაწმენდა (postgres-ით, RLS-ის მიღმა)
delete from public.notifications where title = '__აუდიტი__';
delete from public.booking_requests where note = '__აუდიტი__';
delete from public.tasks where title = '__აუდიტი__';
delete from public.lead_apartment_interests where apartment_code = '__აუდიტი__';

select step, info from diag order by step;
