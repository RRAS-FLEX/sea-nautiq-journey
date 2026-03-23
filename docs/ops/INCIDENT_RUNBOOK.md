# Incident Runbook

## Severity
- **P1**: Booking flow broken, payments failing, overlapping confirmations, major outage.
- **P2**: Partial degradation (email queue delay, owner notifications delayed, map issues).
- **P3**: Minor UI bugs, non-critical errors.

## First 15 Minutes (P1)
1. Acknowledge incident in shared channel.
2. Freeze risky deploys.
3. Check core health:
   - App availability
   - Supabase connectivity
   - `bookings` write path
   - Payment webhook status
4. If overlap risk detected: temporarily disable new booking confirmation endpoint/action.
5. Assign roles: Incident Commander, Investigator, Communications.

## Booking Trust Failure (Overlap) Procedure
1. Query potential overlaps by boat/date/time.
2. Identify latest conflicting booking by `created_at`.
3. Keep earliest valid booking as source of truth.
4. Cancel conflicting booking and notify customer immediately.
5. Log event in `booking_events` and incident timeline.

## Communication Templates
- Customer: "We detected a conflict during booking protection checks. Your payment/booking status is being handled with priority."
- Owner: "A temporary booking conflict was detected and resolved. Your calendar is now consistent."

## Recovery & Closure
- Verify metrics back to normal for 30 minutes.
- Publish incident summary:
  - root cause
  - impact window
  - affected users
  - corrective actions
- Create follow-up tasks with owners and due dates.
