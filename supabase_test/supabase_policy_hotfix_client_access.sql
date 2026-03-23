-- Hotfix for policy regressions introduced during readiness hardening.
-- Run this once in the Supabase SQL editor if boats/history/booking flows disappeared.

begin;

create or replace function public.is_admin_user(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = uid
  );
$$;

create or replace function public.has_mfa_session_or_service_role()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() ->> 'mfa_verified', 'false') = 'true'
    or coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    or current_setting('jwt.claims.role', true) = 'service_role'
    or auth.role() = 'service_role';
$$;

do $$
begin
  if to_regclass('public.boats') is not null then
    execute 'drop policy if exists boats_select_public_active on public.boats';
    execute 'drop policy if exists boats_mfa_guard on public.boats';
    execute 'drop policy if exists boats_mfa_insert_guard on public.boats';
    execute 'drop policy if exists boats_mfa_update_guard on public.boats';
    execute 'drop policy if exists boats_mfa_delete_guard on public.boats';

    execute $p$
      create policy boats_select_public_active
      on public.boats for select
      using (lower(coalesce(status, 'active')) not in ('inactive', 'maintenance', 'archived', 'draft'))
    $p$;

    execute $p$
      create policy boats_mfa_insert_guard
      on public.boats
      as restrictive
      for insert
      to authenticated
      with check (public.has_mfa_session_or_service_role())
    $p$;

    execute $p$
      create policy boats_mfa_update_guard
      on public.boats
      as restrictive
      for update
      to authenticated
      using (public.has_mfa_session_or_service_role())
      with check (public.has_mfa_session_or_service_role())
    $p$;

    execute $p$
      create policy boats_mfa_delete_guard
      on public.boats
      as restrictive
      for delete
      to authenticated
      using (public.has_mfa_session_or_service_role())
    $p$;
  end if;

  if to_regclass('public.bookings') is not null then
    execute 'drop policy if exists bookings_insert_customer_or_admin on public.bookings';
    execute 'drop policy if exists bookings_mfa_guard on public.bookings';
    execute 'drop policy if exists bookings_mfa_insert_guard on public.bookings';
    execute 'drop policy if exists bookings_mfa_update_guard on public.bookings';
    execute 'drop policy if exists bookings_mfa_delete_guard on public.bookings';

    execute $p$
      create policy bookings_insert_customer_or_admin
      on public.bookings for insert
      with check (
        (auth.uid() is null and customer_id is null)
        or customer_id = auth.uid()
        or public.is_admin_user(auth.uid())
      )
    $p$;

    execute $p$
      create policy bookings_mfa_insert_guard
      on public.bookings
      as restrictive
      for insert
      to authenticated
      with check (
        coalesce(customer_id, auth.uid()) = auth.uid()
        or public.has_mfa_session_or_service_role()
      )
    $p$;

    execute $p$
      create policy bookings_mfa_update_guard
      on public.bookings
      as restrictive
      for update
      to authenticated
      using (public.has_mfa_session_or_service_role())
      with check (public.has_mfa_session_or_service_role())
    $p$;

    execute $p$
      create policy bookings_mfa_delete_guard
      on public.bookings
      as restrictive
      for delete
      to authenticated
      using (public.has_mfa_session_or_service_role())
    $p$;
  end if;

  if to_regclass('public.owner_notifications') is not null then
    execute 'drop policy if exists owner_notifications_insert_admin_only on public.owner_notifications';
    execute 'drop policy if exists owner_notifications_insert_app_or_admin on public.owner_notifications';
    execute 'drop policy if exists owner_notifications_mfa_guard on public.owner_notifications';
    execute 'drop policy if exists owner_notifications_mfa_insert_guard on public.owner_notifications';
    execute 'drop policy if exists owner_notifications_mfa_update_guard on public.owner_notifications';
    execute 'drop policy if exists owner_notifications_mfa_delete_guard on public.owner_notifications';

    execute $p$
      create policy owner_notifications_insert_app_or_admin
      on public.owner_notifications for insert
      with check (true)
    $p$;

    execute $p$
      create policy owner_notifications_mfa_insert_guard
      on public.owner_notifications
      as restrictive
      for insert
      to authenticated
      with check (public.has_mfa_session_or_service_role())
    $p$;

    execute $p$
      create policy owner_notifications_mfa_update_guard
      on public.owner_notifications
      as restrictive
      for update
      to authenticated
      using (public.has_mfa_session_or_service_role())
      with check (public.has_mfa_session_or_service_role())
    $p$;

    execute $p$
      create policy owner_notifications_mfa_delete_guard
      on public.owner_notifications
      as restrictive
      for delete
      to authenticated
      using (public.has_mfa_session_or_service_role())
    $p$;
  end if;

  if to_regclass('public.customer_emails') is not null then
    execute 'drop policy if exists customer_emails_insert_admin_only on public.customer_emails';
    execute 'drop policy if exists customer_emails_insert_app_or_admin on public.customer_emails';
    execute 'drop policy if exists customer_emails_mfa_guard on public.customer_emails';
    execute 'drop policy if exists customer_emails_mfa_insert_guard on public.customer_emails';
    execute 'drop policy if exists customer_emails_mfa_update_guard on public.customer_emails';
    execute 'drop policy if exists customer_emails_mfa_delete_guard on public.customer_emails';

    execute $p$
      create policy customer_emails_insert_app_or_admin
      on public.customer_emails for insert
      with check (true)
    $p$;

    execute $p$
      create policy customer_emails_mfa_insert_guard
      on public.customer_emails
      as restrictive
      for insert
      to authenticated
      with check (public.has_mfa_session_or_service_role())
    $p$;

    execute $p$
      create policy customer_emails_mfa_update_guard
      on public.customer_emails
      as restrictive
      for update
      to authenticated
      using (public.has_mfa_session_or_service_role())
      with check (public.has_mfa_session_or_service_role())
    $p$;

    execute $p$
      create policy customer_emails_mfa_delete_guard
      on public.customer_emails
      as restrictive
      for delete
      to authenticated
      using (public.has_mfa_session_or_service_role())
    $p$;
  end if;
end $$;

commit;