-- Enforce MFA-aware write access immediately.
-- Uses session JWT claims (`mfa_verified` or `aal=aal2`) with service role bypass.

begin;

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

-- Restrictive write policies keep read access, but block protected writes unless MFA session is verified.
do $$
begin
  if to_regclass('public.boats') is not null then
    execute 'drop policy if exists boats_mfa_guard on public.boats';
    execute 'drop policy if exists boats_mfa_insert_guard on public.boats';
    execute 'drop policy if exists boats_mfa_update_guard on public.boats';
    execute 'drop policy if exists boats_mfa_delete_guard on public.boats';
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
    execute 'drop policy if exists bookings_mfa_guard on public.bookings';
    execute 'drop policy if exists bookings_mfa_insert_guard on public.bookings';
    execute 'drop policy if exists bookings_mfa_iinsert_guard on public.bookings';
    execute 'drop policy if exists booking_mfa_iinsert on public.bookings';
    execute 'drop policy if exists bookings_mfa_update_guard on public.bookings';
    execute 'drop policy if exists bookings_mfa_delete_guard on public.bookings';
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
    execute 'drop policy if exists owner_notifications_mfa_guard on public.owner_notifications';
    execute 'drop policy if exists owner_notifications_mfa_insert_guard on public.owner_notifications';
    execute 'drop policy if exists owner_notifications_mfa_update_guard on public.owner_notifications';
    execute 'drop policy if exists owner_notifications_mfa_delete_guard on public.owner_notifications';
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
    execute 'drop policy if exists customer_emails_mfa_guard on public.customer_emails';
    execute 'drop policy if exists customer_emails_mfa_insert_guard on public.customer_emails';
    execute 'drop policy if exists customer_emails_mfa_update_guard on public.customer_emails';
    execute 'drop policy if exists customer_emails_mfa_delete_guard on public.customer_emails';
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
