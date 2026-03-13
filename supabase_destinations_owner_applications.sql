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

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  image text,
  boats integer not null default 0,
  description text not null default '',
  best_for text not null default '',
  is_featured boolean not null default true,
  display_order integer not null default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table public.destinations enable row level security;

drop policy if exists "Anyone can read destinations" on public.destinations;
create policy "Anyone can read destinations"
on public.destinations
for select to anon, authenticated
using (true);

insert into public.destinations (slug, name, image, boats, description, best_for, is_featured, display_order)
values
  ('thassos', 'Thassos', 'thassos/cover.jpg', 24, 'Crystal-clear bays, pine-lined coast, and relaxed island pacing.', 'Families & first-time boat trips', true, 1),
  ('halkidiki', 'Halkidiki', 'halkidiki/cover.jpg', 18, 'Long beaches and scenic peninsulas with calm summer waters.', 'Day cruises & snorkeling', true, 2),
  ('mykonos', 'Mykonos', 'mykonos/cover.jpg', 32, 'Vibrant beach culture and iconic sunset routes to nearby islands.', 'Groups & premium experiences', true, 3),
  ('santorini', 'Santorini', 'santorini/cover.jpg', 28, 'Volcanic cliffs, dramatic caldera views, and signature sunset sailings.', 'Couples & luxury charters', true, 4)
on conflict (slug) do update
set
  name = excluded.name,
  image = excluded.image,
  boats = excluded.boats,
  description = excluded.description,
  best_for = excluded.best_for,
  is_featured = excluded.is_featured,
  display_order = excluded.display_order,
  updated_at = now();

alter table public.owner_applications add column if not exists applicant_user_id uuid references public.users(id) on delete set null;
alter table public.owner_applications add column if not exists owner_email text;
alter table public.owner_applications add column if not exists notes text;
alter table public.owner_applications add column if not exists reviewed_at timestamp;
alter table public.owner_applications add column if not exists reviewed_by uuid references public.users(id) on delete set null;

drop policy if exists "Users can submit owner verification applications" on public.owner_applications;
create policy "Users can submit owner verification applications"
on public.owner_applications
for insert to authenticated
with check (
  type = 'owner_verification'
  and applicant_user_id = auth.uid()
);

drop policy if exists "Users can read own owner applications" on public.owner_applications;
create policy "Users can read own owner applications"
on public.owner_applications
for select to authenticated
using (applicant_user_id = auth.uid());

alter table public.bookings add column if not exists payment_method text default 'stripe';
alter table public.bookings add column if not exists payment_plan text default 'deposit';
alter table public.bookings add column if not exists amount_due_now numeric default 0;
alter table public.bookings add column if not exists deposit_amount numeric default 0;
alter table public.bookings add column if not exists platform_commission numeric default 0;
alter table public.bookings add column if not exists owner_payout numeric default 0;