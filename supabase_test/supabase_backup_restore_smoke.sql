-- Backup restore smoke validation
-- Run this in the restored environment after a restore drill.

select now() as smoke_checked_at;

-- Critical table existence
select
  relname as table_name,
  relkind,
  relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and relname in (
    'users',
    'boats',
    'bookings',
    'calendar_events',
    'owner_notifications',
    'customer_emails',
    'booking_events'
  )
order by relname;

-- Basic row counts (expect non-zero in real environments)
select 'users' as table_name, count(*) as row_count from public.users
union all
select 'boats' as table_name, count(*) as row_count from public.boats
union all
select 'bookings' as table_name, count(*) as row_count from public.bookings
union all
select 'calendar_events' as table_name, count(*) as row_count from public.calendar_events
order by table_name;

-- Booking trust constraints sanity
select
  count(*) filter (where request_id is not null) as bookings_with_request_id,
  count(*) as total_bookings
from public.bookings;

-- Latest booking events available
select id, booking_id, event_type, created_at
from public.booking_events
order by created_at desc
limit 10;
