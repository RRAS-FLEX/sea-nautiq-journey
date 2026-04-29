-- Boat-level external calendar sync and flash-sale settings.
-- Run this alongside the existing calendar_events setup.

ALTER TABLE public.boats
  ADD COLUMN IF NOT EXISTS external_calendar_url text,
  ADD COLUMN IF NOT EXISTS flash_sale_enabled boolean NOT NULL DEFAULT FALSE;

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS external_source text,
  ADD COLUMN IF NOT EXISTS external_source_uid text,
  ADD COLUMN IF NOT EXISTS external_source_url text;

CREATE INDEX IF NOT EXISTS calendar_events_boat_id_external_source_idx
  ON public.calendar_events USING btree (boat_id, external_source);

CREATE INDEX IF NOT EXISTS calendar_events_boat_id_external_source_uid_idx
  ON public.calendar_events USING btree (boat_id, external_source_uid);
