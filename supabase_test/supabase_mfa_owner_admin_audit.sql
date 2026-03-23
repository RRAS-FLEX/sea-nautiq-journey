-- MFA audit and enforcement readiness for privileged users (owners + admins)
-- Run in Supabase SQL editor

begin;

-- Security-definer helper to avoid direct permission issues on auth.mfa_factors.
create or replace function public.verified_mfa_factor_count(uid uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  factor_count integer := 0;
begin
  begin
    select count(*)::int
    into factor_count
    from auth.mfa_factors f
    where f.user_id = uid
      and f.status::text = 'verified';
  exception
    when insufficient_privilege then
      return 0;
    when undefined_table then
      return 0;
  end;

  return coalesce(factor_count, 0);
end;
$$;

-- 1) Audit privileged users and MFA status
-- If auth.mfa_factors is unavailable in your project version, this will still return users with mfa_enabled=false.
with privileged_users as (
  select u.id as user_id, u.email, 'owner'::text as role
  from public.users u
  where coalesce(u.is_owner, false) = true
  union
  select u.id as user_id, u.email, 'admin'::text as role
  from public.admin_users a
  join public.users u on u.id = a.user_id
)
select
  p.user_id,
  p.email,
  string_agg(distinct p.role, ', ' order by p.role) as roles,
  max(public.verified_mfa_factor_count(p.user_id)) as verified_factor_count,
  (max(public.verified_mfa_factor_count(p.user_id)) > 0) as mfa_enabled
from privileged_users p
group by p.user_id, p.email
order by mfa_enabled asc, p.email asc;

-- 2) Optional helper function for RLS policies (no-op for non-privileged users)
create or replace function public.has_verified_mfa(uid uuid)
returns boolean
language sql
stable
as $$
  select public.verified_mfa_factor_count(uid) > 0;
$$;

create or replace function public.require_mfa_for_privileged_user(uid uuid)
returns boolean
language sql
stable
as $$
  with privileged as (
    select exists (select 1 from public.users u where u.id = uid and coalesce(u.is_owner, false) = true)
        or exists (select 1 from public.admin_users a where a.user_id = uid) as is_privileged
  )
  select case
    when (select is_privileged from privileged) = false then true
    else public.has_verified_mfa(uid)
  end;
$$;

-- 3) Optional enforcement policies (COMMENTED OUT by default)
-- Un-comment only when your owner/admin MFA rollout is complete.
--
-- drop policy if exists boats_mfa_guard on public.boats;
-- create policy boats_mfa_guard
-- on public.boats
-- as restrictive
-- for all
-- using (public.require_mfa_for_privileged_user(auth.uid()))
-- with check (public.require_mfa_for_privileged_user(auth.uid()));
--
-- drop policy if exists bookings_mfa_guard on public.bookings;
-- create policy bookings_mfa_guard
-- on public.bookings
-- as restrictive
-- for all
-- using (public.require_mfa_for_privileged_user(auth.uid()))
-- with check (public.require_mfa_for_privileged_user(auth.uid()));

commit;
