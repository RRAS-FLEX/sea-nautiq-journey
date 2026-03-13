-- =============================================================
-- Nautiq — Supabase Storage Buckets + Policies
-- Run this in Supabase SQL Editor after core table migrations
-- =============================================================

-- Bucket architecture:
-- 1) boat-images            (public)  : public listing/hero/boat photos
-- 2) destination-images     (public)  : destination banners/cards
-- 3) profile-images         (public)  : owner/customer avatars
-- 4) boat-documents         (private) : insurance, licenses, permits
-- 5) review-media           (public)  : optional customer review photos
-- 6) owner-verification-docs(private) : KYC/identity/company verification docs
-- 7) chat-attachments       (private) : private chat files (signed-url delivery)
-- 8) payment-receipts       (private) : invoices/receipts/proofs
-- 9) support-attachments    (private) : support ticket files
-- 10) temp-uploads          (private) : short-lived uploads (auto cleanup)

-- -------------------------------------------------------------
-- 1) Create buckets (idempotent)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('boat-images', 'boat-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('destination-images', 'destination-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('boat-documents', 'boat-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('review-media', 'review-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('owner-verification-docs', 'owner-verification-docs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('support-attachments', 'support-attachments', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('temp-uploads', 'temp-uploads', false)
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- 2) Public READ policies
-- -------------------------------------------------------------
drop policy if exists "Public can view boat images" on storage.objects;
create policy "Public can view boat images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'boat-images');

drop policy if exists "Public can view destination images" on storage.objects;
create policy "Public can view destination images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'destination-images');

drop policy if exists "Public can view profile images" on storage.objects;
create policy "Public can view profile images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'profile-images');

drop policy if exists "Public can view review media" on storage.objects;
create policy "Public can view review media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'review-media');

-- -------------------------------------------------------------
-- 3) Authenticated upload/update/delete for public media
--    Naming convention: <user-id>/<entity-id>/<filename>
-- -------------------------------------------------------------
drop policy if exists "Authenticated can upload boat images" on storage.objects;
create policy "Authenticated can upload boat images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'boat-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can manage own boat images" on storage.objects;
create policy "Owners can manage own boat images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'boat-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'boat-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can delete own boat images" on storage.objects;
create policy "Owners can delete own boat images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'boat-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload profile images" on storage.objects;
create policy "Users can upload profile images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own profile images" on storage.objects;
create policy "Users can update own profile images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own profile images" on storage.objects;
create policy "Users can delete own profile images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated can upload review media" on storage.objects;
create policy "Authenticated can upload review media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'review-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own review media" on storage.objects;
create policy "Users can update own review media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'review-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'review-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own review media" on storage.objects;
create policy "Users can delete own review media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'review-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- -------------------------------------------------------------
-- 4) Private boat documents
--    Naming convention: <owner-user-id>/<boat-id>/<filename>
-- -------------------------------------------------------------
drop policy if exists "Owners can upload own boat documents" on storage.objects;
create policy "Owners can upload own boat documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'boat-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can view own boat documents" on storage.objects;
create policy "Owners can view own boat documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'boat-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can update own boat documents" on storage.objects;
create policy "Owners can update own boat documents"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'boat-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'boat-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can delete own boat documents" on storage.objects;
create policy "Owners can delete own boat documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'boat-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- -------------------------------------------------------------
-- 5) Owner verification docs (private)
--    Naming convention: <owner-user-id>/<verification-id>/<filename>
-- -------------------------------------------------------------
drop policy if exists "Owners can upload own verification docs" on storage.objects;
create policy "Owners can upload own verification docs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'owner-verification-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can view own verification docs" on storage.objects;
create policy "Owners can view own verification docs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'owner-verification-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can update own verification docs" on storage.objects;
create policy "Owners can update own verification docs"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'owner-verification-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'owner-verification-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can delete own verification docs" on storage.objects;
create policy "Owners can delete own verification docs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'owner-verification-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- -------------------------------------------------------------
-- 6) Chat attachments (private, signed-url delivery)
--    Naming convention: <user-id>/<thread-id>/<filename>
-- -------------------------------------------------------------
drop policy if exists "Users can upload own chat attachments" on storage.objects;
create policy "Users can upload own chat attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can manage own chat attachments" on storage.objects;
create policy "Users can manage own chat attachments"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'chat-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'chat-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own chat attachments" on storage.objects;
create policy "Users can delete own chat attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- -------------------------------------------------------------
-- 7) Payment receipts (private)
--    Naming convention: <user-id>/<booking-id>/<filename>
-- -------------------------------------------------------------
drop policy if exists "Users can upload own payment receipts" on storage.objects;
create policy "Users can upload own payment receipts"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can view own payment receipts" on storage.objects;
create policy "Users can view own payment receipts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own payment receipts" on storage.objects;
create policy "Users can delete own payment receipts"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- -------------------------------------------------------------
-- 8) Support attachments (private)
--    Naming convention: <user-id>/<ticket-id>/<filename>
-- -------------------------------------------------------------
drop policy if exists "Users can upload own support attachments" on storage.objects;
create policy "Users can upload own support attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'support-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can view own support attachments" on storage.objects;
create policy "Users can view own support attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'support-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own support attachments" on storage.objects;
create policy "Users can update own support attachments"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'support-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'support-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own support attachments" on storage.objects;
create policy "Users can delete own support attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'support-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- -------------------------------------------------------------
-- 10) Temp uploads (private, short-lived)
--     Naming convention: <user-id>/<purpose>/<filename>
-- -------------------------------------------------------------
drop policy if exists "Users can upload temp files" on storage.objects;
create policy "Users can upload temp files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'temp-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can view own temp files" on storage.objects;
create policy "Users can view own temp files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'temp-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own temp files" on storage.objects;
create policy "Users can delete own temp files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'temp-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Optional cleanup function for temp uploads (older than 24h)
create or replace function public.cleanup_temp_uploads()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from storage.objects
  where bucket_id = 'temp-uploads'
    and created_at < now() - interval '24 hours';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cleanup_temp_uploads() from public, anon, authenticated;
grant execute on function public.cleanup_temp_uploads() to service_role;

-- Optional scheduler (requires pg_cron extension enabled in your project)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'cleanup-temp-uploads-hourly') then
      perform cron.schedule(
        'cleanup-temp-uploads-hourly',
        '0 * * * *',
        'select public.cleanup_temp_uploads();'
      );
    end if;
  end if;
exception
  when others then
    raise notice 'pg_cron not available or schedule failed: %', sqlerrm;
end
$$;
