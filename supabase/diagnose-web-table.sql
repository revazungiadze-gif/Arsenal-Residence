-- რომელი ცხრილიდან კითხულობს ახალი ვები ლიდებს?
-- ვეძებთ ვების სქრინშოტზე ჩანს ჩანაწერს (ტელეფონით) ყველა ცხრილში,
-- რომელსაც phone-ის მსგავსი სვეტი აქვს.

create temp table diag(step text, info text);

do $$
declare
  r record;
  cnt bigint;
begin
  for r in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and c.data_type in ('text','character varying')
      and c.column_name in ('phone','phone_number','mobile','contact_phone')
  loop
    execute format(
      'select count(*) from public.%I where %I like %L',
      r.table_name, r.column_name, '%595208769%'
    ) into cnt;
    if cnt > 0 then
      insert into diag values ('match » ' || r.table_name || '.' || r.column_name, cnt::text);
    end if;
  end loop;
end $$;

-- ყველა ცხრილი ბოლო ცვლილების მასშტაბით (რომ ვნახოთ რა ცხრილები არსებობს)
insert into diag
select 'table', table_name
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

select step, info from diag order by step;
