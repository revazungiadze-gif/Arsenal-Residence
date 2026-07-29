-- დიაგნოსტიკა: სად ზის რეალური "გაყიდვების" ინფორმაცია (მხოლოდ კითხულობს)
select 'A_bookings_by_status' as k, coalesce(status,'null') as v, count(*)::int as c
from booking_requests group by status
union all
select 'B_leads_won', 'won', count(*)::int from leads where status = 'won'
union all
select 'C_won_with_apartment', 'linked', count(*)::int
from leads where status = 'won' and (apartment_id is not null or apartment_code is not null)
union all
select 'D_approved_this_month', 'jul2026', count(*)::int
from booking_requests
where status = 'approved'
  and reviewed_at >= date_trunc('month', now())
union all
select 'E_apartments_by_status', coalesce(status,'null'), count(*)::int
from apartments group by status
union all
select 'F_payments_rows', 'total', count(*)::int from payments
order by 1, 2;
