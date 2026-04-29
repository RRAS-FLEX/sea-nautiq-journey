-- Owner performance badges: schema, view, function, triggers

-- 1. Support column for response time on bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- 2. Badges catalog
CREATE TABLE IF NOT EXISTS badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  icon_slug   TEXT NOT NULL UNIQUE,
  description TEXT
);

-- 3. Owner ↔ badges assignments
CREATE TABLE IF NOT EXISTS boat_owner_badges (
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, badge_id)
);

-- 4. RLS (read-only for public, owner can see own badges)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE boat_owner_badges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'badges'
      AND policyname = 'Public can read badges'
  ) THEN
    CREATE POLICY "Public can read badges"
      ON badges FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'boat_owner_badges'
      AND policyname = 'Owners can read their badges'
  ) THEN
    CREATE POLICY "Owners can read their badges"
      ON boat_owner_badges FOR SELECT
      USING (auth.uid() = owner_id);
  END IF;

  -- Allow public read access so customer-facing listings can surface badges
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'boat_owner_badges'
      AND policyname = 'Public can read owner badges'
  ) THEN
    CREATE POLICY "Public can read owner badges"
      ON boat_owner_badges FOR SELECT
      USING (true);
  END IF;
END $$;

-- 5. Seed core badges
INSERT INTO badges (name, icon_slug, description)
VALUES
  ('Fast Responder', 'fast-responder',
   'For owners with average response time under 30 minutes.'),
  ('Zero-Cancel', 'zero-cancel',
   'For owners with zero cancellations in the last 30 days.'),
  ('Elite Host', 'elite-host',
   'For owners with 5+ bookings and an average rating above 4.8.')
ON CONFLICT (name) DO NOTHING;

-- 6. Performance view per owner
CREATE OR REPLACE VIEW owner_performance_metrics AS
WITH owner_bookings AS (
  SELECT
    b.owner_id,
    COUNT(*) FILTER (
      WHERE bk.status IN ('confirmed', 'completed')
    ) AS total_bookings,
    COUNT(*) FILTER (
      WHERE bk.status = 'cancelled'
        AND bk.updated_at >= now() - INTERVAL '30 days'
    ) AS cancellations_last_30d,
    AVG(
      EXTRACT(EPOCH FROM (bk.accepted_at - bk.created_at)) / 60.0
    ) FILTER (WHERE bk.accepted_at IS NOT NULL) AS avg_response_minutes
  FROM boats b
  JOIN bookings bk
    ON bk.boat_id = b.id
  GROUP BY b.owner_id
),
owner_ratings AS (
  SELECT
    b.owner_id,
    AVG(r.rating::NUMERIC) AS avg_rating
  FROM boats b
  JOIN reviews r
    ON r.boat_id = b.id
  GROUP BY b.owner_id
)
SELECT
  u.id AS owner_id,
  COALESCE(ob.total_bookings, 0)         AS total_bookings,
  COALESCE(orv.avg_rating, 0)            AS avg_rating,
  COALESCE(ob.cancellations_last_30d, 0) AS cancellations_last_30d,
  ob.avg_response_minutes                AS avg_response_minutes
FROM users u
LEFT JOIN owner_bookings ob ON ob.owner_id = u.id
LEFT JOIN owner_ratings  orv ON orv.owner_id = u.id
WHERE u.is_owner IS TRUE;

-- 6b. Public view for badges on boat listings
-- Exposes, per boat, the current set of badges for its owner
CREATE OR REPLACE VIEW boat_listing_owner_badges AS
SELECT
  bo.id AS boat_id,
  json_agg(
    json_build_object(
      'name',      bd.name,
      'icon_slug', bd.icon_slug
    )
    ORDER BY bd.name
  ) AS owner_badges
FROM boats bo
JOIN boat_owner_badges ob
  ON ob.owner_id = bo.owner_id
JOIN badges bd
  ON bd.id = ob.badge_id
GROUP BY bo.id;

-- 7. Core refresh function: recompute all badges from current metrics
CREATE OR REPLACE FUNCTION fn_refresh_owner_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Rebuild assignments from scratch (tables are small)
  -- Some environments enable safe-update extensions that reject
  -- DELETE statements without a WHERE clause, so include a
  -- trivially-true predicate here.
  DELETE FROM boat_owner_badges
  WHERE TRUE;

  -- Fast Responder: avg response < 30 mins
  INSERT INTO boat_owner_badges (owner_id, badge_id, assigned_at)
  SELECT
    m.owner_id,
    b.id,
    v_now
  FROM owner_performance_metrics m
  JOIN badges b ON b.name = 'Fast Responder'
  WHERE m.avg_response_minutes IS NOT NULL
    AND m.avg_response_minutes < 30;

  -- Zero-Cancel: 0 cancellations in last 30 days and at least 1 booking
  INSERT INTO boat_owner_badges (owner_id, badge_id, assigned_at)
  SELECT
    m.owner_id,
    b.id,
    v_now
  FROM owner_performance_metrics m
  JOIN badges b ON b.name = 'Zero-Cancel'
  WHERE m.total_bookings > 0
    AND m.cancellations_last_30d = 0;

  -- Elite Host: 5+ bookings and avg rating > 4.8
  INSERT INTO boat_owner_badges (owner_id, badge_id, assigned_at)
  SELECT
    m.owner_id,
    b.id,
    v_now
  FROM owner_performance_metrics m
  JOIN badges b ON b.name = 'Elite Host'
  WHERE m.total_bookings >= 5
    AND m.avg_rating > 4.8;
END;
$$;

-- 8. Trigger wrapper to call refresh function after relevant changes
CREATE OR REPLACE FUNCTION trg_refresh_owner_badges_after_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM fn_refresh_owner_badges();
  RETURN NEW;
END;
$$;

-- 9. Triggers on bookings and reviews
DROP TRIGGER IF EXISTS bookings_refresh_owner_badges ON bookings;
CREATE TRIGGER bookings_refresh_owner_badges
AFTER INSERT OR UPDATE OF status, accepted_at
ON bookings
FOR EACH STATEMENT
EXECUTE FUNCTION trg_refresh_owner_badges_after_change();

DROP TRIGGER IF EXISTS reviews_refresh_owner_badges ON reviews;
CREATE TRIGGER reviews_refresh_owner_badges
AFTER INSERT OR UPDATE OF rating
ON reviews
FOR EACH STATEMENT
EXECUTE FUNCTION trg_refresh_owner_badges_after_change();

-- 10. Optional: if pg_cron is available in your project, schedule periodic refresh
-- SELECT
--   cron.schedule(
--     'refresh_owner_badges_hourly',
--     '0 * * * *',             -- every hour
--     $$SELECT public.fn_refresh_owner_badges();$$
--   );
