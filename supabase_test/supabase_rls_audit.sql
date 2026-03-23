-- RLS audit helper for critical tables
-- Run in Supabase SQL editor (read-only checks)

with target_tables as (
  select unnest(array['bookings', 'boats', 'owner_notifications', 'customer_emails']) as table_name
)
select
  'public' as schema_name,
  t.table_name,
  (c.oid is not null) as table_exists,
  coalesce(c.relrowsecurity, false) as rls_enabled,
  coalesce(c.relforcerowsecurity, false) as rls_forced
from target_tables t
left join pg_class c on c.relname = t.table_name
left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
order by t.table_name;

select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('bookings', 'boats', 'owner_notifications', 'customer_emails')
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('bookings', 'boats', 'owner_notifications', 'customer_emails')
order by tablename, policyname;

select
  tablename,
  count(*) as policy_count,
  count(*) filter (where cmd = 'SELECT') as select_policies,
  count(*) filter (where cmd = 'INSERT') as insert_policies,
  count(*) filter (where cmd = 'UPDATE') as update_policies,
  count(*) filter (where cmd = 'DELETE') as delete_policies
from pg_policies
where schemaname = 'public'
  and tablename in ('bookings', 'boats', 'owner_notifications', 'customer_emails')
group by tablename
order by tablename;
