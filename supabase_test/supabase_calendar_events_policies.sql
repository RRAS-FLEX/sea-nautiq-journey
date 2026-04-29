-- Row-Level Security policies for calendar_events
-- Ensure that:
-- - Anyone (public/anon) can read availability blocks by boat_id
-- - Authenticated owners can manage their own events

-- Enable RLS if not already enabled
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Public read access for availability lookup on booking calendars
CREATE POLICY IF NOT EXISTS "Anyone can view boat calendar events"
ON public.calendar_events
FOR SELECT
USING (true);

-- Owners manage their own calendar events via user_id
CREATE POLICY IF NOT EXISTS "Owners can manage own calendar events"
ON public.calendar_events
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
