-- დიაგნოსტიკა: მომხმარებლები (uuid-ები ტაიმინგ-ტესტისთვის)
select u.id::text as uid, u.email, coalesce(p.role,'—') as role
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at
limit 10;
