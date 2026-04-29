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

-- Separate tables for core packages vs. boat extras

-- Core trip packages (per owner, reusable across boats via owner_package_boats)
CREATE TABLE IF NOT EXISTS public.owner_packages (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	owner_id uuid NOT NULL,
	name text NOT NULL,
	duration_hours integer NOT NULL,
	price numeric NOT NULL,
	description text NULL DEFAULT ''::text,
	created_at timestamp without time zone NULL DEFAULT now(),
	updated_at timestamp without time zone NULL DEFAULT now(),
	CONSTRAINT owner_packages_pkey PRIMARY KEY (id),
	CONSTRAINT owner_packages_owner_id_fkey
		FOREIGN KEY (owner_id) REFERENCES public.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_owner_packages_owner_id
	ON public.owner_packages(owner_id);

-- Per-boat trip packages join table
CREATE TABLE IF NOT EXISTS public.owner_package_boats (
	package_id uuid NOT NULL,
	boat_id uuid NOT NULL,
	created_at timestamp without time zone NULL DEFAULT now(),
	CONSTRAINT owner_package_boats_pkey PRIMARY KEY (package_id, boat_id),
	CONSTRAINT owner_package_boats_package_id_fkey
		FOREIGN KEY (package_id) REFERENCES public.owner_packages (id) ON DELETE CASCADE,
	CONSTRAINT owner_package_boats_boat_id_fkey
		FOREIGN KEY (boat_id) REFERENCES public.boats (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_owner_package_boats_boat_id
	ON public.owner_package_boats(boat_id);

-- New tables for extras

CREATE TABLE IF NOT EXISTS public.owner_extras (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	owner_id uuid NOT NULL,
	name text NOT NULL,
	price numeric NOT NULL,
	description text NULL DEFAULT ''::text,
	created_at timestamp without time zone NULL DEFAULT now(),
	updated_at timestamp without time zone NULL DEFAULT now(),
	CONSTRAINT owner_extras_pkey PRIMARY KEY (id),
	CONSTRAINT owner_extras_owner_id_fkey
		FOREIGN KEY (owner_id) REFERENCES public.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_owner_extras_owner_id
	ON public.owner_extras(owner_id);

CREATE TABLE IF NOT EXISTS public.owner_extra_boats (
	extra_id uuid NOT NULL,
	boat_id uuid NOT NULL,
	created_at timestamp without time zone NULL DEFAULT now(),
	CONSTRAINT owner_extra_boats_pkey PRIMARY KEY (extra_id, boat_id),
	CONSTRAINT owner_extra_boats_extra_id_fkey
		FOREIGN KEY (extra_id) REFERENCES public.owner_extras (id) ON DELETE CASCADE,
	CONSTRAINT owner_extra_boats_boat_id_fkey
		FOREIGN KEY (boat_id) REFERENCES public.boats (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_owner_extra_boats_boat_id
	ON public.owner_extra_boats(boat_id);

-- One-time migration: move existing extras (marked with [boat-extra])
-- from owner_packages/owner_package_boats into the new extras tables

DO $$
DECLARE
	v_owner_id uuid;
	v_pkg_id uuid;
	v_extra_id uuid;
BEGIN
	FOR v_pkg_id, v_owner_id IN
		SELECT p.id, p.owner_id
		FROM owner_packages p
		WHERE p.duration_hours = 0
			AND p.description ILIKE '%[boat-extra]%'
	LOOP
		INSERT INTO owner_extras (owner_id, name, price, description)
		SELECT owner_id, name, price, description
		FROM owner_packages
		WHERE id = v_pkg_id
		RETURNING id INTO v_extra_id;

		INSERT INTO owner_extra_boats (extra_id, boat_id)
		SELECT v_extra_id, boat_id
		FROM owner_package_boats
		WHERE package_id = v_pkg_id;

		DELETE FROM owner_package_boats WHERE package_id = v_pkg_id;
		DELETE FROM owner_packages WHERE id = v_pkg_id;
	END LOOP;
END $$;
