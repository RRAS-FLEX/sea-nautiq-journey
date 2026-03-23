-- Enable real customer <-> owner messaging access in chat tables.
-- Run this in Supabase SQL editor.

begin;

create or replace function public.chat_owner_has_boat_access(boat_id_text text, uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.boats b
    where b.id::text = boat_id_text
      and b.owner_id = uid
  );
$$;

alter table if exists public.chat_threads enable row level security;
alter table if exists public.chat_messages enable row level security;

-- Remove legacy customer-only policies if present.
drop policy if exists "Customers can manage own chat threads" on public.chat_threads;
drop policy if exists "Users can read thread messages" on public.chat_messages;
drop policy if exists "Customers can send own messages" on public.chat_messages;
drop policy if exists "Service can add owner replies" on public.chat_messages;

-- Chat threads access
create policy chat_threads_select_customer_owner_admin
on public.chat_threads
for select
using (
  customer_id = auth.uid()
  or public.chat_owner_has_boat_access(boat_id, auth.uid())
  or public.is_admin_user(auth.uid())
);

create policy chat_threads_insert_customer_only
on public.chat_threads
for insert
with check (
  customer_id = auth.uid()
);

create policy chat_threads_update_customer_owner_admin
on public.chat_threads
for update
using (
  customer_id = auth.uid()
  or public.chat_owner_has_boat_access(boat_id, auth.uid())
  or public.is_admin_user(auth.uid())
)
with check (
  customer_id = auth.uid()
  or public.chat_owner_has_boat_access(boat_id, auth.uid())
  or public.is_admin_user(auth.uid())
);

-- Chat messages access
create policy chat_messages_select_customer_owner_admin
on public.chat_messages
for select
using (
  exists (
    select 1
    from public.chat_threads t
    where t.id = chat_messages.thread_id
      and (
        t.customer_id = auth.uid()
        or public.chat_owner_has_boat_access(t.boat_id, auth.uid())
        or public.is_admin_user(auth.uid())
      )
  )
);

create policy chat_messages_insert_customer
on public.chat_messages
for insert
with check (
  sender_role = 'customer'
  and sender_user_id = auth.uid()
  and exists (
    select 1
    from public.chat_threads t
    where t.id = chat_messages.thread_id
      and t.customer_id = auth.uid()
  )
);

create policy chat_messages_insert_owner
on public.chat_messages
for insert
with check (
  sender_role = 'owner'
  and sender_user_id = auth.uid()
  and exists (
    select 1
    from public.chat_threads t
    where t.id = chat_messages.thread_id
      and public.chat_owner_has_boat_access(t.boat_id, auth.uid())
  )
);

commit;
