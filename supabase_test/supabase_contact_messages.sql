-- Contact messages captured from the website contact form and support flows
-- Run this in your Supabase SQL editor or as part of your migration process.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  page_url text null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_contact_messages_created_at
  on public.contact_messages using btree (created_at);

create index if not exists idx_contact_messages_email
  on public.contact_messages using btree (email);
