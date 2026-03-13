-- =============================================================
-- Nautiq — Boat & Owner Detail Columns Extension
-- Run this in Supabase SQL Editor AFTER running
-- supabase_full_app_migration.sql and supabase_seed.sql
-- =============================================================

-- ── 1. Add rich detail columns to boats table ──
alter table public.boats add column if not exists description text;
alter table public.boats add column if not exists length_meters numeric(5,1);
alter table public.boats add column if not exists year integer;
alter table public.boats add column if not exists cruising_speed_knots integer;
alter table public.boats add column if not exists fuel_burn_litres_per_hour integer;
alter table public.boats add column if not exists departure_marina text;
alter table public.boats add column if not exists cancellation_policy text;
alter table public.boats add column if not exists response_time text;
alter table public.boats add column if not exists map_query text;
alter table public.boats add column if not exists unavailable_dates text[] default '{}';
alter table public.boats add column if not exists min_notice_hours integer default 24;
alter table public.boats add column if not exists skipper_required boolean default false;
alter table public.boats add column if not exists documents_folder text;

-- ── 2. Add owner profile columns to users table ──
alter table public.users add column if not exists owner_title text;
alter table public.users add column if not exists owner_bio text;
alter table public.users add column if not exists owner_languages text[] default '{}';
alter table public.users add column if not exists is_superhost boolean default false;
alter table public.users add column if not exists response_rate integer default 95;

-- ── 3. Populate boat details for seeded boats ──
update public.boats set
  description            = 'Comfort-focused yacht ideal for half-day and full-day island cruising.',
  length_meters          = 9.8,
  year                   = 2021,
  cruising_speed_knots   = 24,
  fuel_burn_litres_per_hour = 18,
  departure_marina       = 'Limenas Marina',
  cancellation_policy    = 'Free cancellation up to 72 hours before departure',
  response_time          = 'Usually replies within 15 minutes',
  map_query              = 'Limenas Marina, Thassos, Greece',
  unavailable_dates      = array['2026-03-18','2026-03-22','2026-03-29','2026-04-05'],
  min_notice_hours       = 18
where id = 'b1000000-0000-0000-0000-000000000001';

update public.boats set
  description            = 'Fast and sporty ride for quick island hopping and private tours.',
  length_meters          = 7.1,
  year                   = 2022,
  cruising_speed_knots   = 34,
  fuel_burn_litres_per_hour = 24,
  departure_marina       = 'Golden Beach Dock',
  cancellation_policy    = 'Free cancellation up to 48 hours before departure',
  response_time          = 'Usually replies within 10 minutes',
  map_query              = 'Golden Beach Dock, Thassos, Greece',
  unavailable_dates      = array['2026-03-16','2026-03-21','2026-03-28','2026-04-03'],
  min_notice_hours       = 12
where id = 'b2000000-0000-0000-0000-000000000002';

update public.boats set
  description            = 'Spacious catamaran with premium deck space for groups and events.',
  length_meters          = 12.4,
  year                   = 2020,
  cruising_speed_knots   = 18,
  fuel_burn_litres_per_hour = 22,
  departure_marina       = 'Nikiti Harbor',
  cancellation_policy    = 'Free cancellation up to 5 days before departure',
  response_time          = 'Usually replies within 20 minutes',
  map_query              = 'Nikiti Harbor, Halkidiki, Greece',
  unavailable_dates      = array['2026-03-19','2026-03-24','2026-03-30','2026-04-06'],
  min_notice_hours       = 24
where id = 'b3000000-0000-0000-0000-000000000003';

update public.boats set
  description            = 'Traditional Greek style boat for intimate and scenic coastal trips.',
  length_meters          = 6.4,
  year                   = 2018,
  cruising_speed_knots   = 14,
  fuel_burn_litres_per_hour = 10,
  departure_marina       = 'Ornos Bay Pier',
  cancellation_policy    = 'Free cancellation up to 72 hours before departure',
  response_time          = 'Usually replies within 30 minutes',
  map_query              = 'Ornos Bay Pier, Mykonos, Greece',
  unavailable_dates      = array['2026-03-17','2026-03-26','2026-04-01','2026-04-08'],
  min_notice_hours       = 24
where id = 'b4000000-0000-0000-0000-000000000004';

update public.boats set
  description            = 'Agile RIB perfect for adventure-focused rides and hidden coves.',
  length_meters          = 6.9,
  year                   = 2023,
  cruising_speed_knots   = 30,
  fuel_burn_litres_per_hour = 16,
  departure_marina       = 'Potos Jet Dock',
  cancellation_policy    = 'Free cancellation up to 48 hours before departure',
  response_time          = 'Usually replies within 12 minutes',
  map_query              = 'Potos Jet Dock, Thassos, Greece',
  unavailable_dates      = array['2026-03-20','2026-03-27','2026-04-02','2026-04-09'],
  min_notice_hours       = 10
where id = 'b5000000-0000-0000-0000-000000000005';

update public.boats set
  description            = 'Flagship luxury yacht tailored for VIP groups and sunset cruises.',
  length_meters          = 16.3,
  year                   = 2024,
  cruising_speed_knots   = 26,
  fuel_burn_litres_per_hour = 35,
  departure_marina       = 'Vlychada Marina',
  cancellation_policy    = 'Free cancellation up to 7 days before departure',
  response_time          = 'Usually replies within 8 minutes',
  map_query              = 'Vlychada Marina, Santorini, Greece',
  unavailable_dates      = array['2026-03-15','2026-03-23','2026-03-31','2026-04-07'],
  min_notice_hours       = 36
where id = 'b6000000-0000-0000-0000-000000000006';

-- ── 4. Populate owner profile details for seeded users ──
update public.users set
  owner_title     = 'Harbor host',
  owner_bio       = 'Runs smooth family-friendly day trips with a focus on calm swim stops and easy boarding.',
  owner_languages = array['English','Greek'],
  is_superhost    = true,
  response_rate   = 98
where id = 'a1000000-0000-0000-0000-000000000001';

update public.users set
  owner_title     = 'Speed boat specialist',
  owner_bio       = 'Known for fast departures, tight timing, and route planning built around hidden coves.',
  owner_languages = array['English','Greek','Italian'],
  is_superhost    = true,
  response_rate   = 99
where id = 'a2000000-0000-0000-0000-000000000002';

update public.users set
  owner_title     = 'Event charter host',
  owner_bio       = 'Hosts celebration charters and large-group itineraries with strong onboard service coordination.',
  owner_languages = array['English','Greek','German'],
  is_superhost    = true,
  response_rate   = 97
where id = 'a3000000-0000-0000-0000-000000000003';

update public.users set
  owner_title     = 'Local guide owner',
  owner_bio       = 'Focuses on quiet bays, traditional routes, and low-stress private outings for couples and small groups.',
  owner_languages = array['English','Greek'],
  is_superhost    = false,
  response_rate   = 95
where id = 'a4000000-0000-0000-0000-000000000004';

update public.users set
  owner_title     = 'Adventure route host',
  owner_bio       = 'Builds active sea days with cliff jumps, quick transfers, and exact meeting-point coordination.',
  owner_languages = array['English','Greek','French'],
  is_superhost    = true,
  response_rate   = 99
where id = 'a5000000-0000-0000-0000-000000000005';

update public.users set
  owner_title     = 'Luxury charter owner',
  owner_bio       = 'Delivers concierge-style yacht days with detailed pre-trip planning and fast guest communication.',
  owner_languages = array['English','Greek','Spanish'],
  is_superhost    = true,
  response_rate   = 100
where id = 'a6000000-0000-0000-0000-000000000006';

-- ── 5. Favorites table for customer saved boats ──
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  boat_id uuid not null references public.boats(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  unique(user_id, boat_id)
);

create index if not exists idx_favorites_user_id on public.favorites(user_id);
create index if not exists idx_favorites_boat_id on public.favorites(boat_id);

alter table public.favorites enable row level security;

drop policy if exists "Users can manage own favorites" on public.favorites;
create policy "Users can manage own favorites"
on public.favorites
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
