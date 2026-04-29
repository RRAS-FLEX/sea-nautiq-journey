-- Dynamic commission system for fuel-inclusive bookings

-- 1. global_settings table
CREATE TABLE IF NOT EXISTS public.global_settings (
  key TEXT PRIMARY KEY,
  value NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed base values if missing
INSERT INTO public.global_settings (key, value)
VALUES
  ('oil_price_per_liter', 1.95),           -- EUR per liter
  ('base_commission_percentage', 0.20)     -- 20% of base rental price
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

-- Enable RLS and allow read access to authenticated users
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'global_settings' AND policyname = 'global_settings_select_authenticated'
  ) THEN
    CREATE POLICY global_settings_select_authenticated
      ON public.global_settings
      FOR SELECT
      USING (auth.role() IN ('authenticated', 'service_role', 'anon'));
  END IF;
END$$;

-- 2. Extend boats with fuel_burn_rate_per_hour and base_daily_rate
ALTER TABLE public.boats
  ADD COLUMN IF NOT EXISTS fuel_burn_rate_per_hour NUMERIC,
  ADD COLUMN IF NOT EXISTS base_daily_rate NUMERIC;

-- Backfill base_daily_rate from existing price_per_day if null
UPDATE public.boats
SET base_daily_rate = price_per_day
WHERE base_daily_rate IS NULL;

-- 3. Extend bookings with fuel/commission fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS fuel_included BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS duration_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS estimated_fuel_cost NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_agency_commission NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_rental_price NUMERIC;

-- Derive duration_hours from existing start_date / end_date if possible
UPDATE public.bookings
SET duration_hours = GREATEST(1, (end_date::TIMESTAMPTZ - start_date::TIMESTAMPTZ) / INTERVAL '1 hour')
WHERE duration_hours IS NULL;

-- 4. Commission calculation function and trigger
CREATE OR REPLACE FUNCTION public.fn_calculate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_oil_price_per_liter NUMERIC;
  v_base_commission_percentage NUMERIC;
  v_fuel_burn_rate_per_hour NUMERIC;
  v_base_daily_rate NUMERIC;
  v_days NUMERIC;
  v_base_rental_price NUMERIC;
  v_fuel_cost NUMERIC;
BEGIN
  -- Load global settings
  SELECT value INTO v_oil_price_per_liter
  FROM public.global_settings
  WHERE key = 'oil_price_per_liter';

  IF v_oil_price_per_liter IS NULL THEN
    RAISE EXCEPTION 'oil_price_per_liter not configured in global_settings';
  END IF;

  SELECT value INTO v_base_commission_percentage
  FROM public.global_settings
  WHERE key = 'base_commission_percentage';

  IF v_base_commission_percentage IS NULL THEN
    RAISE EXCEPTION 'base_commission_percentage not configured in global_settings';
  END IF;

  -- Load boat parameters
  SELECT b.fuel_burn_rate_per_hour, COALESCE(b.base_daily_rate, b.price_per_day)
  INTO v_fuel_burn_rate_per_hour, v_base_daily_rate
  FROM public.boats b
  WHERE b.id = NEW.boat_id;

  IF v_base_daily_rate IS NULL THEN
    RAISE EXCEPTION 'Boat % missing base_daily_rate/price_per_day', NEW.boat_id;
  END IF;

  IF NEW.duration_hours IS NULL THEN
    -- Fallback: derive from start_date / end_date if present on schema
    BEGIN
      NEW.duration_hours := GREATEST(1, (NEW.end_date::TIMESTAMPTZ - NEW.start_date::TIMESTAMPTZ) / INTERVAL '1 hour');
    EXCEPTION WHEN undefined_column THEN
      NEW.duration_hours := 24; -- safe default: 1 day
    END;
  END IF;

  -- Base rental price: explicit override or derived from daily rate
  IF NEW.base_rental_price IS NOT NULL THEN
    v_base_rental_price := NEW.base_rental_price;
  ELSE
    v_days := CEIL(NEW.duration_hours / 24.0);
    v_base_rental_price := v_days * v_base_daily_rate;
  END IF;

  IF v_base_rental_price < 0 THEN
    RAISE EXCEPTION 'Invalid base_rental_price %', v_base_rental_price;
  END IF;

  -- Fuel cost estimate (0 if burn rate null or zero)
  IF v_fuel_burn_rate_per_hour IS NULL THEN
    v_fuel_burn_rate_per_hour := 0;
  END IF;

  v_fuel_cost := v_fuel_burn_rate_per_hour * NEW.duration_hours * v_oil_price_per_liter;

  NEW.estimated_fuel_cost := COALESCE(v_fuel_cost, 0);

  -- Base commission on rental only
  NEW.total_agency_commission := v_base_rental_price * v_base_commission_percentage;

  -- If fuel is included, agency must also recover fuel from its cut
  IF NEW.fuel_included THEN
    NEW.total_agency_commission := NEW.total_agency_commission + NEW.estimated_fuel_cost;
  END IF;

  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calculate_commission ON public.bookings;

CREATE TRIGGER trg_calculate_commission
BEFORE INSERT OR UPDATE OF
  boat_id,
  duration_hours,
  fuel_included,
  base_rental_price
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.fn_calculate_commission();
