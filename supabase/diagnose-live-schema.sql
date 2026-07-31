-- ცოცხალი (EU) ბაზის სრული სქემა აპის მოსარგებად:
-- CHECK-შეზღუდვები, არსებული პოლისები, ფუნქციები, სტატუსების რეალური განაწილება
create temp table diag(step text, info text);

insert into diag
select c.conrelid::regclass::text || ' » ' || c.conname, pg_get_constraintdef(c.oid)
from pg_constraint c
where c.contype = 'c'
  and c.conrelid::regclass::text in
    ('leads','tasks','booking_requests','notifications','apartments',
     'lead_notes','lead_apartment_interests','profiles','brokers','deals');

insert into diag
select 'policy » ' || tablename || ' [' || cmd || ']', policyname
from pg_policies
where schemaname = 'public'
  and tablename in ('leads','tasks','booking_requests','notifications',
                    'apartments','lead_notes','lead_apartment_interests','profiles');

insert into diag
select 'function', proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname like '%role%' or proname like 'mobile%';

insert into diag
select 'lead_status » ' || status, count(*)::text
from public.leads group by status;

insert into diag
select 'leads_column', column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'leads'
order by ordinal_position;

select step, info from diag order by step;
