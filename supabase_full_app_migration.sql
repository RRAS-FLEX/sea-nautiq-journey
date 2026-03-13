do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'admin_approvals'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'owner_applications'
  ) then
    alter table public.admin_approvals rename to owner_applications;
  end if;
end
$$;

alter table public.reviews alter column customer_id drop not null;
alter table public.reviews add column if not exists customer_name text;
alter table public.reviews add column if not exists title text;
alter table public.reviews add column if not exists trip_date date;
alter table public.reviews add column if not exists booking_id text;

alter table public.bookings alter column customer_id drop not null;
alter table public.bookings add column if not exists customer_name text;
alter table public.bookings add column if not exists customer_email text;
alter table public.bookings add column if not exists boat_name text;
alter table public.bookings add column if not exists owner_name text;
alter table public.bookings add column if not exists package_label text;
alter table public.bookings add column if not exists guests integer default 1;
alter table public.bookings add column if not exists departure_time text;
alter table public.bookings add column if not exists departure_marina text;
alter table public.bookings add column if not exists extras jsonb default '[]'::jsonb;
alter table public.bookings add column if not exists notes text;

create table if not exists public.owner_packages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  duration_hours integer not null,
  price numeric not null,
  description text default '',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists public.owner_package_boats (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.owner_packages(id) on delete cascade,
  boat_id uuid not null references public.boats(id) on delete cascade,
  created_at timestamp default now(),
  unique(package_id, boat_id)
);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  boat_id text not null,
  boat_name text not null,
  owner_name text not null,
  customer_id uuid not null references public.users(id) on delete cascade,
  created_at timestamp default now(),
  last_updated_at timestamp default now(),
  unique(boat_id, customer_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  boat_id text not null,
  sender_role text not null check (sender_role in ('customer', 'owner')),
  sender_user_id uuid references public.users(id) on delete set null,
  text text not null,
  created_at timestamp default now()
);

create table if not exists public.business_tickets (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  business_type text not null check (business_type in ('hotel', 'travel-agent', 'villa', 'other')),
  contact_name text not null,
  contact_email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'approved')),
  created_at timestamp default now()
);

create table if not exists public.owner_applications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('owner_verification', 'boat_listing')),
  owner_name text not null,
  title text not null,
  submitted_at timestamp default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

create table if not exists public.owner_notifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  owner_name text not null,
  owner_email text not null,
  subject text not null,
  message text not null,
  created_at timestamp default now(),
  status text not null default 'queued' check (status in ('queued', 'sent'))
);

create table if not exists public.customer_emails (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  to_email text not null,
  subject text not null,
  preview_text text not null,
  body text not null,
  created_at timestamp default now(),
  status text not null default 'queued' check (status in ('queued', 'sent'))
);

alter table public.owner_packages enable row level security;
alter table public.owner_package_boats enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.business_tickets enable row level security;
alter table public.owner_applications enable row level security;
alter table public.owner_notifications enable row level security;
alter table public.customer_emails enable row level security;

alter table public.bookings enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Users can manage own packages" on public.owner_packages;
create policy "Users can manage own packages"
on public.owner_packages
for all to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Owners can manage package boats" on public.owner_package_boats;
create policy "Owners can manage package boats"
on public.owner_package_boats
for all to authenticated
using (package_id in (select id from public.owner_packages where owner_id = auth.uid()))
with check (package_id in (select id from public.owner_packages where owner_id = auth.uid()));

drop policy if exists "Customers can manage own chat threads" on public.chat_threads;
create policy "Customers can manage own chat threads"
on public.chat_threads
for all to authenticated
using (auth.uid() = customer_id)
with check (auth.uid() = customer_id);

drop policy if exists "Users can read thread messages" on public.chat_messages;
create policy "Users can read thread messages"
on public.chat_messages
for select to authenticated
using (thread_id in (select id from public.chat_threads where customer_id = auth.uid()));

drop policy if exists "Customers can send own messages" on public.chat_messages;
create policy "Customers can send own messages"
on public.chat_messages
for insert to authenticated
with check (thread_id in (select id from public.chat_threads where customer_id = auth.uid()) and sender_role = 'customer' and sender_user_id = auth.uid());

drop policy if exists "Service can add owner replies" on public.chat_messages;
create policy "Service can add owner replies"
on public.chat_messages
for insert to authenticated
with check (sender_role = 'owner');

drop policy if exists "Anyone can create business tickets" on public.business_tickets;
create policy "Anyone can create business tickets"
on public.business_tickets
for insert to anon, authenticated
with check (true);

drop policy if exists "Users can insert bookings" on public.bookings;
create policy "Users can insert bookings"
on public.bookings
for insert to anon, authenticated
with check (true);

drop policy if exists "Owners can read bookings for own boats" on public.bookings;
create policy "Owners can read bookings for own boats"
on public.bookings
for select to authenticated
using (
  boat_id in (select id from public.boats where owner_id = auth.uid())
  or customer_id = auth.uid()
);

drop policy if exists "Anyone can insert reviews" on public.reviews;
create policy "Anyone can insert reviews"
on public.reviews
for insert to anon, authenticated
with check (true);

drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
on public.reviews
for select to anon, authenticated
using (true);

drop policy if exists "Users can read own notifications" on public.owner_notifications;
create policy "Users can read own notifications"
on public.owner_notifications
for select to authenticated
using (true);

drop policy if exists "Users can insert notifications" on public.owner_notifications;
create policy "Users can insert notifications"
on public.owner_notifications
for insert to anon, authenticated
with check (true);

drop policy if exists "Users can insert customer emails" on public.customer_emails;
create policy "Users can insert customer emails"
on public.customer_emails
for insert to anon, authenticated
with check (true);

drop policy if exists "Users can read customer emails" on public.customer_emails;
create policy "Users can read customer emails"
on public.customer_emails
for select to authenticated
using (true);
