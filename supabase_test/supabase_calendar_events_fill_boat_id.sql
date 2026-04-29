-- Backfill and trigger to ensure calendar_events.boat_id is always set
-- based on the related booking when booking_id is present.

-- 1) One-time backfill for existing rows
UPDATE public.calendar_events AS ce
SET boat_id = b.boat_id
FROM public.bookings AS b
WHERE ce.booking_id = b.id
  AND ce.boat_id IS NULL;

-- 2) Trigger function to auto-fill boat_id from bookings
CREATE OR REPLACE FUNCTION public.fn_calendar_events_fill_boat_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.boat_id IS NULL AND NEW.booking_id IS NOT NULL THEN
    SELECT b.boat_id
    INTO NEW.boat_id
    FROM public.bookings AS b
    WHERE b.id = NEW.booking_id;
    -- If no matching booking is found, NEW.boat_id will remain NULL.
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Trigger on insert/update of calendar_events
DROP TRIGGER IF EXISTS trg_calendar_events_fill_boat_id ON public.calendar_events;

CREATE TRIGGER trg_calendar_events_fill_boat_id
BEFORE INSERT OR UPDATE OF booking_id, boat_id
ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.fn_calendar_events_fill_boat_id();
