-- Supabase RLS policy cleanup (safe/targeted)
-- Purpose: remove legacy overlapping policies that inflate policy counts and can weaken intent.
-- Run AFTER applying supabase_rls_recommended_policies.sql and supabase_mfa_enforce_now.sql.

begin;

-- 1) Remove legacy broad/old policy names from earlier migrations.
do $$
declare
  r record;
begin
  -- Boats legacy broad owner policy (causes cmd=ALL drift)
  execute 'drop policy if exists "Users can manage own boats" on public.boats';

  -- Bookings legacy broad insert/select
  execute 'drop policy if exists "Users can insert bookings" on public.bookings';
  execute 'drop policy if exists "Owners can read bookings for own boats" on public.bookings';

  -- Notifications/email legacy broad policies
  execute 'drop policy if exists "Users can read own notifications" on public.owner_notifications';
  execute 'drop policy if exists "Users can insert notifications" on public.owner_notifications';

  execute 'drop policy if exists "Users can insert customer emails" on public.customer_emails';
  execute 'drop policy if exists "Users can read customer emails" on public.customer_emails';

  -- Safety: drop old all-command MFA guards if they ever reappear.
  execute 'drop policy if exists boats_mfa_guard on public.boats';
  execute 'drop policy if exists bookings_mfa_guard on public.bookings';
  execute 'drop policy if exists owner_notifications_mfa_guard on public.owner_notifications';
  execute 'drop policy if exists customer_emails_mfa_guard on public.customer_emails';

  -- Final sweep: remove any lingering ALL-command policies on critical tables,
  -- regardless of policy name (legacy drift from older migrations).
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('boats', 'bookings', 'owner_notifications', 'customer_emails')
      and cmd = 'ALL'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

commit;

-- 2) Post-cleanup verification (same summary shape you shared)
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

-- 3) Remaining ALL-command policies should be empty for critical tables.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
from pg_policies
where schemaname = 'public'
  and tablename in ('boats', 'bookings', 'owner_notifications', 'customer_emails')
  and cmd = 'ALL'
order by tablename, policyname;
