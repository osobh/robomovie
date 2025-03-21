-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Add columns to the existing users table if they don't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add unique constraint to email if it doesn't exist.
-- This requires checking for existing constraints, which is a bit complex in SQL.
-- We'll use a DO $$ ... EXCEPTION WHEN ... END $$ block to handle the case where the constraint already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
    AND conname = 'users_email_key'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Constraint already exists, do nothing
END $$;

-- Create a trigger function to automatically create a user record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, email)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email)
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing auth users, only if full_name and email are NULL in the public.users table
INSERT INTO public.users (id, full_name, email)
SELECT id, raw_user_meta_data->>'full_name', email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
  OR id IN (SELECT id FROM public.users WHERE full_name IS NULL OR email IS NULL)
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email
WHERE public.users.full_name IS NULL OR public.users.email IS NULL;
