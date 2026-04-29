-- Boat locations (marinas / meeting points)
-- Shared across owners; can be filtered by location on the frontend.

create table if not exists public.boat_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  map_query text not null,
  latitude double precision null,
  longitude double precision null,
  created_at timestamp without time zone default now()
) tablespace pg_default;

create index if not exists idx_boat_locations_location
  on public.boat_locations (location);
