-- =============================================================
-- Nautiq — Demo Seed Data
-- Run this in Supabase SQL Editor AFTER running
-- supabase_full_app_migration.sql
-- =============================================================

-- ── 1. Seed demo owner profiles (no real auth account needed) ──
-- These are display-only owners for the catalogue. Real users
-- are created through the sign-up flow; these seed users let
-- the demo boats show up in the table immediately.

insert into public.users (id, email, name, is_owner, created_at, updated_at)
values
  ('a1000000-0000-0000-0000-000000000001', 'nikos@nautiq-demo.com', 'Nikos Andreou', true, now(), now()),
  ('a2000000-0000-0000-0000-000000000002', 'eleni@nautiq-demo.com', 'Eleni Pavlou', true, now(), now()),
  ('a3000000-0000-0000-0000-000000000003', 'maria@nautiq-demo.com', 'Maria Kosta', true, now(), now()),
  ('a4000000-0000-0000-0000-000000000004', 'petros@nautiq-demo.com', 'Petros Melis', true, now(), now()),
  ('a5000000-0000-0000-0000-000000000005', 'sofia@nautiq-demo.com', 'Sofia Leka', true, now(), now()),
  ('a6000000-0000-0000-0000-000000000006', 'alexis@nautiq-demo.com', 'Alexis Marinakis', true, now(), now())
on conflict (id) do nothing;

-- ── 2. Seed demo boats ──

insert into public.boats
  (id, owner_id, name, type, location, capacity, price_per_day, rating, image, status, bookings, revenue, created_at, updated_at)
values
  (
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Aegean Breeze',
    'Motor Yacht',
    'Thassos',
    8,
    250,
    4.9,
    'https://images.unsplash.com/photo-1549439602-43ebca2327af?w=800&q=80',
    'active',
    148,
    37000,
    now(), now()
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000002',
    'Poseidon Express',
    'Speed Boat',
    'Thassos',
    6,
    350,
    4.8,
    'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80',
    'active',
    112,
    39200,
    now(), now()
  ),
  (
    'b3000000-0000-0000-0000-000000000003',
    'a3000000-0000-0000-0000-000000000003',
    'Blue Horizon',
    'Catamaran',
    'Halkidiki',
    12,
    500,
    5.0,
    'https://images.unsplash.com/photo-1502664669895-7c5f69b7bebd?w=800&q=80',
    'active',
    204,
    102000,
    now(), now()
  ),
  (
    'b4000000-0000-0000-0000-000000000004',
    'a4000000-0000-0000-0000-000000000004',
    'Traditional Explorer',
    'Classic Wooden',
    'Mykonos',
    4,
    120,
    4.7,
    'https://images.unsplash.com/photo-1575397997756-4bb72ad2e47e?w=800&q=80',
    'active',
    86,
    10320,
    now(), now()
  ),
  (
    'b5000000-0000-0000-0000-000000000005',
    'a5000000-0000-0000-0000-000000000005',
    'Wave Runner',
    'RIB',
    'Thassos',
    5,
    180,
    4.6,
    'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800&q=80',
    'active',
    73,
    13140,
    now(), now()
  ),
  (
    'b6000000-0000-0000-0000-000000000006',
    'a6000000-0000-0000-0000-000000000006',
    'Mediterranean Star',
    'Luxury Yacht',
    'Santorini',
    20,
    900,
    4.9,
    'https://images.unsplash.com/photo-1612186808803-a95a3f72b7a5?w=800&q=80',
    'active',
    129,
    116100,
    now(), now()
  )
on conflict (id) do nothing;

-- ── 3. Seed boat features (amenities) ──

insert into public.boat_features (boat_id, feature)
values
  -- Aegean Breeze
  ('b1000000-0000-0000-0000-000000000001', 'Skipper'),
  ('b1000000-0000-0000-0000-000000000001', 'Bluetooth audio'),
  ('b1000000-0000-0000-0000-000000000001', 'Snorkeling kit'),
  ('b1000000-0000-0000-0000-000000000001', 'Cooler'),
  -- Poseidon Express
  ('b2000000-0000-0000-0000-000000000002', 'Skipper'),
  ('b2000000-0000-0000-0000-000000000002', 'Sun canopy'),
  ('b2000000-0000-0000-0000-000000000002', 'USB charger'),
  ('b2000000-0000-0000-0000-000000000002', 'Safety gear'),
  -- Blue Horizon
  ('b3000000-0000-0000-0000-000000000003', 'Crew'),
  ('b3000000-0000-0000-0000-000000000003', 'Lunch option'),
  ('b3000000-0000-0000-0000-000000000003', 'SUP board'),
  ('b3000000-0000-0000-0000-000000000003', 'Private cabin'),
  -- Traditional Explorer
  ('b4000000-0000-0000-0000-000000000004', 'Local captain'),
  ('b4000000-0000-0000-0000-000000000004', 'Shade deck'),
  ('b4000000-0000-0000-0000-000000000004', 'Refreshments'),
  -- Wave Runner
  ('b5000000-0000-0000-0000-000000000005', 'Guide'),
  ('b5000000-0000-0000-0000-000000000005', 'Life jackets'),
  ('b5000000-0000-0000-0000-000000000005', 'Fuel included'),
  -- Mediterranean Star
  ('b6000000-0000-0000-0000-000000000006', 'Crew'),
  ('b6000000-0000-0000-0000-000000000006', 'Chef service'),
  ('b6000000-0000-0000-0000-000000000006', 'Premium lounge'),
  ('b6000000-0000-0000-0000-000000000006', 'Jacuzzi')
on conflict (boat_id, feature) do nothing;

-- ── 4. Seed demo reviews ──

insert into public.reviews
  (id, boat_id, customer_id, customer_name, rating, title, comment, trip_date, created_at)
values
  (
    gen_random_uuid(),
    'b1000000-0000-0000-0000-000000000001',
    null,
    'James T.',
    5,
    'Perfect family day',
    'Nikos was punctual and helpful. Kids loved the snorkeling stops. Would book again.',
    '2026-03-10',
    now()
  ),
  (
    gen_random_uuid(),
    'b1000000-0000-0000-0000-000000000001',
    null,
    'Sophie L.',
    5,
    'Smooth and scenic',
    'The boat was incredibly clean. Skipper knew all the quiet coves. Magical sunset.',
    '2026-03-04',
    now()
  ),
  (
    gen_random_uuid(),
    'b2000000-0000-0000-0000-000000000002',
    null,
    'Marco R.',
    5,
    'Best speed on the island',
    'Eleni planned our route perfectly. Three hidden bays in one day. Unbelievable.',
    '2026-03-08',
    now()
  ),
  (
    gen_random_uuid(),
    'b2000000-0000-0000-0000-000000000002',
    null,
    'Anna K.',
    4,
    'Fast and fun',
    'Great ride, excellent timing. Slight wait at the harbor but the experience made up for it.',
    '2026-03-02',
    now()
  ),
  (
    gen_random_uuid(),
    'b3000000-0000-0000-0000-000000000003',
    null,
    'Henrik B.',
    5,
    'Party-perfect catamaran',
    'Hosted our team event on Blue Horizon. Maria arranged everything down to the last detail.',
    '2026-03-06',
    now()
  ),
  (
    gen_random_uuid(),
    'b3000000-0000-0000-0000-000000000003',
    null,
    'Yasmin Z.',
    5,
    'Unforgettable Halkidiki cruise',
    'Massive deck, private cabin for the kids, lunch on board. Everyone was floored.',
    '2026-02-27',
    now()
  ),
  (
    gen_random_uuid(),
    'b4000000-0000-0000-0000-000000000004',
    null,
    'Chris D.',
    5,
    'Hidden gem for couples',
    'Petros took us to a bay I had never seen on any map. Ancient & beautiful.',
    '2026-03-07',
    now()
  ),
  (
    gen_random_uuid(),
    'b5000000-0000-0000-0000-000000000005',
    null,
    'Lea M.',
    5,
    'Adrenaline on the water',
    'Sofia hit every cliff spot and timing was spot-on. Sea scooter add-on was insane!',
    '2026-03-09',
    now()
  ),
  (
    gen_random_uuid(),
    'b6000000-0000-0000-0000-000000000006',
    null,
    'David W.',
    5,
    'Worth every euro',
    'Alexis had champagne ready before we even boarded. Jacuzzi at sea, chef-prepared mezze. 10/10.',
    '2026-03-11',
    now()
  ),
  (
    gen_random_uuid(),
    'b6000000-0000-0000-0000-000000000006',
    null,
    'Claire S.',
    5,
    'Luxury charter done right',
    'The crew was incredible. Best sunset of our lives from the deck near Oia.',
    '2026-03-05',
    now()
  )
on conflict do nothing;

-- ── 5. Make sure the "anyone can view boats" policy exists ──
-- (Already created in SUPABASE_SETUP.md, this is idempotent)

drop policy if exists "Anyone can view active boats" on public.boats;
create policy "Anyone can view active boats"
  on public.boats
  for select
  to anon, authenticated
  using (status = 'active');

-- Allow anonymous/authenticated reads on boat_features and reviews
drop policy if exists "Anyone can view boat features" on public.boat_features;
create policy "Anyone can view boat features"
  on public.boat_features
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
  on public.reviews
  for select
  to anon, authenticated
  using (true);
