-- Stripe Connect + Checkout storage fields
-- Run this once in Supabase SQL editor.

alter table if exists public.users
  add column if not exists stripe_account_id text;

create unique index if not exists idx_users_stripe_account_id_unique
  on public.users (stripe_account_id)
  where stripe_account_id is not null;

alter table if exists public.bookings
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent_id text;

create index if not exists idx_bookings_stripe_session_id
  on public.bookings (stripe_session_id)
  where stripe_session_id is not null;

create index if not exists idx_bookings_stripe_payment_intent_id
  on public.bookings (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
