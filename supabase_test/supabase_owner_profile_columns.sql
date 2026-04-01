-- Add owner profile columns to users table
-- This migration adds profile data fields needed for the "Hosted by" section on boat detail pages

-- Add columns with default values
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_title TEXT DEFAULT 'Boat Owner';
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_languages TEXT[] DEFAULT ARRAY['English'];
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superhost BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS response_rate INTEGER DEFAULT 95 CHECK (response_rate >= 0 AND response_rate <= 100);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_is_superhost ON users(is_superhost);
CREATE INDEX IF NOT EXISTS idx_users_response_rate ON users(response_rate);

-- Optional: Update RLS policies to allow public read of owner profiles
-- This allows non-authenticated users to see boat owner information
-- Uncomment these lines if you have RLS enabled:

-- DROP POLICY IF EXISTS "Anyone can view active boat owner profiles" ON users;
-- CREATE POLICY "Anyone can view active boat owner profiles"
--   ON users FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM boats WHERE boats.owner_id = users.id AND boats.status = 'active'
--     )
--   );
