-- Supabase RLS threat audit (read-only)
-- Purpose: detect risky policy patterns that can reintroduce data exposure or abuse.

-- 1) Policies on critical tables with broad TRUE conditions.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  permissive,
  coalesce(qual, '') as using_expr,
  coalesce(with_check, '') as with_check_expr
from pg_policies
where schemaname = 'public'
  and tablename in ('boats', 'bookings', 'owner_notifications', 'customer_emails')
  and (
    coalesce(qual, '') in ('true', '(true)')
    or coalesce(with_check, '') in ('true', '(true)')
  )
order by tablename, cmd, policyname;

-- 2) Any SELECT policies on critical tables granted to anon/public roles.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  permissive,
  coalesce(qual, '') as using_expr
from pg_policies
where schemaname = 'public'
  and tablename in ('boats', 'bookings', 'owner_notifications', 'customer_emails')
  and cmd = 'SELECT'
  and (
    roles::text ilike '%anon%'
    or roles::text ilike '%public%'
  )
order by tablename, policyname;

-- 3) Restrictive MFA policies that still use FOR ALL (should be write-only guards).
select
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  coalesce(qual, '') as using_expr,
  coalesce(with_check, '') as with_check_expr
from pg_policies
where schemaname = 'public'
  and tablename in ('boats', 'bookings', 'owner_notifications', 'customer_emails')
  and permissive = 'RESTRICTIVE'
  and cmd = 'ALL'
order by tablename, policyname;

-- 4) Quick summary by table/cmd for situational awareness.
select
  tablename,
  cmd,
  count(*) as policy_count,
  count(*) filter (where permissive = 'PERMISSIVE') as permissive_count,
  count(*) filter (where permissive = 'RESTRICTIVE') as restrictive_count
from pg_policies
where schemaname = 'public'
  and tablename in ('boats', 'bookings', 'owner_notifications', 'customer_emails')
group by tablename, cmd
order by tablename, cmd;
