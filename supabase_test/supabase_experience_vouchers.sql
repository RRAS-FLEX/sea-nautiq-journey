-- Experience categories and party boat support.
-- Adds schema columns for party-ready boats and party ticket fields.
-- RLS: Existing boats table policies already cover these new columns.

BEGIN;

-- 1. Add schema columns for party/event experiences and vouchers
ALTER TABLE public.boats
  ADD COLUMN IF NOT EXISTS party_ready boolean NOT NULL DEFAULT FALSE;

ALTER TABLE public.boats
  ADD COLUMN IF NOT EXISTS ticket_max_people integer,
  ADD COLUMN IF NOT EXISTS ticket_price_per_person numeric(12,2);

-- 1b. Add customer ticketing fields for party bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS party_ticket_code text,
  ADD COLUMN IF NOT EXISTS party_ticket_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS party_ticket_status text;

-- 2. Create index for efficient party boat filtering
CREATE INDEX IF NOT EXISTS boats_party_ready_idx
  ON public.boats USING btree (party_ready);

CREATE INDEX IF NOT EXISTS bookings_party_ticket_code_idx
  ON public.bookings USING btree (party_ticket_code) WHERE party_ticket_code IS NOT NULL;

-- 4. Validation: Ensure columns were added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boats'
      AND column_name = 'party_ready'
  ) THEN
    RAISE EXCEPTION 'Migration failed: party_ready column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boats'
      AND column_name = 'ticket_max_people'
  ) THEN
    RAISE EXCEPTION 'Migration failed: ticket_max_people column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boats'
      AND column_name = 'ticket_price_per_person'
  ) THEN
    RAISE EXCEPTION 'Migration failed: ticket_price_per_person column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boats'
      AND column_name = 'party_ready'
  ) THEN
    RAISE EXCEPTION 'Migration failed: party_ready column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'party_ticket_code'
  ) THEN
    RAISE EXCEPTION 'Migration failed: party_ticket_code column not created';
  END IF;
END $$;

COMMIT;

--    AND column_name IN ('party_ready');
--  WHERE (tablename = 'boats' AND indexname LIKE '%party_ready%')
--     OR (tablename = 'bookings' AND indexname LIKE '%party_ticket%');
 