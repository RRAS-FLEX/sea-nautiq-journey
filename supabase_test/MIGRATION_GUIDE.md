# Supabase Migration: Watersports and Party Boats

## Overview
This migration adds schema support for:
- **Party-ready boats** for event/celebration rentals
- **Party ticketing** fields on bookings for owner-managed event check-in

## Updated Application Features

### 1. Three Category-Based Boat Workflows
- **Traditional Boats & Yachts**: Multi-hour charter experiences (Motor Yachts, Sailboats, Catamarans, etc.)
- **Boat Parties & Events**: Event venues for groups and celebrations (Party Boats, Watersports Charters)
- **Watersports & Equipment**: Hourly rental experiences (Jet Skis, Paddleboards, Kayaks, etc.)

### 2. Boat Management (`boats` table)
**New columns:**
- `party_ready` (boolean): Marks boats that are configured for party/event experiences

**Indexes created:**
- `boats_party_ready_idx`: For efficient party boat filtering

### 3. Booking Tracking (`bookings` table)
**New columns on `bookings`:**
- `party_ticket_code` (text): Ticket code issued for party bookings
- `party_ticket_count` (integer): Number of tickets issued for the booking
- `party_ticket_status` (text): Ticket lifecycle status (issued, used, cancelled)

**Index created:**
- `bookings_party_ticket_code_idx`: For quick lookup of ticket codes

## How to Apply the Migration

### Option A: Using Supabase Dashboard
1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **SQL Editor**
3. Create a new query and paste the contents of `supabase_test/supabase_experience_vouchers.sql`
4. Click **Run** (or ⌘+Enter / Ctrl+Enter)
5. Verify the output shows "BEGIN; COMMIT;" with no errors

### Option B: Using `psql` CLI
```bash
psql "postgresql://[user]:[password]@[host]:5432/[database]" < supabase_test/supabase_experience_vouchers.sql
```

### Option C: Using Supabase CLI
```bash
supabase db push
```
(Ensure the migration file is in your `supabase/migrations/` local directory)

## Verification

After applying the migration, verify the columns were created:

```sql
-- Check boats table columns
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'boats'
   AND column_name IN ('party_ready')
 ORDER BY ordinal_position;

-- Check bookings table columns
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'bookings'
   AND column_name IN ('party_ticket_code', 'party_ticket_count', 'party_ticket_status')
 ORDER BY ordinal_position;

-- Check indexes
SELECT schemaname, tablename, indexname
  FROM pg_indexes
 WHERE tablename IN ('boats', 'bookings')
   AND (indexname LIKE '%party_ready%' OR indexname LIKE '%party_ticket%');
```

## RLS Policies
✅ **No additional RLS policies needed** — existing `boats` and `bookings` table policies automatically cover these new columns.

## Application Code Integration

The following application features now work with this schema:

### Backend (Node.js):
- `server/index.mjs`: Stripe checkout and booking creation updated for party bookings and flash-sale pricing
- `server/booking-pricing.mjs`: Calculates flash-sale discounts and pricing

### Frontend (React):
- `src/components/owner/forms/YachtForm.tsx`: Yacht workflow
- `src/components/owner/forms/PartyBoatForm.tsx`: Party boat workflow
- `src/components/owner/forms/WatersportsForm.tsx`: Watersports equipment workflow
- `src/components/owner/BoatCategorySelector.tsx`: Category picker for new boats
- `src/lib/booking-pricing.ts`: Client-side pricing and flash-sale logic

### Database Helpers:
- `src/lib/boats.ts`: Maps boat rows including new fields
- `src/lib/owner-dashboard.ts`: Persists and loads party configuration
- `src/lib/booking-workflow.ts`: Handles booking workflow metadata for party bookings

## Next Steps

1. **Apply** this migration to your Supabase database
4. **Test** the three new boat workflows in Owner Dashboard
5. **Add sample boats** using each category to verify the forms work

## Rollback (if needed)

If you need to remove these columns:

```sql
BEGIN;

ALTER TABLE public.boats
  DROP COLUMN IF EXISTS party_ready;

ALTER TABLE public.bookings
  DROP COLUMN IF EXISTS party_ticket_code,
  DROP COLUMN IF EXISTS party_ticket_count,
  DROP COLUMN IF EXISTS party_ticket_status;

COMMIT;
```

---

**Migration File**: `supabase_test/supabase_experience_vouchers.sql`  
**Application Type**: React + TypeScript + Node.js + Supabase PostgreSQL  
**Status**: ✅ Ready to apply
