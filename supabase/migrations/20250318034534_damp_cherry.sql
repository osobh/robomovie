/*
  # Fix Movie Settings Schema

  1. Changes
    - Drop existing constraints
    - Add missing columns
    - Update constraints
    - Ensure proper RLS policies

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing constraints
ALTER TABLE movie_settings
DROP CONSTRAINT IF EXISTS valid_mode,
DROP CONSTRAINT IF EXISTS valid_length,
DROP CONSTRAINT IF EXISTS valid_number_of_scenes;

-- Ensure all required columns exist
DO $$ BEGIN
  -- Add genre if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movie_settings' AND column_name = 'genre'
  ) THEN
    ALTER TABLE movie_settings ADD COLUMN genre text;
  END IF;

  -- Add number_of_scenes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movie_settings' AND column_name = 'number_of_scenes'
  ) THEN
    ALTER TABLE movie_settings ADD COLUMN number_of_scenes integer;
  END IF;

  -- Make columns NOT NULL
  ALTER TABLE movie_settings
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN genre SET NOT NULL,
    ALTER COLUMN mode SET NOT NULL,
    ALTER COLUMN length_minutes SET NOT NULL,
    ALTER COLUMN number_of_scenes SET NOT NULL;
END $$;

-- Add constraints
ALTER TABLE movie_settings
ADD CONSTRAINT valid_mode CHECK (mode IN ('managed', 'self_service')),
ADD CONSTRAINT valid_length CHECK (length_minutes IN (1, 5, 15, 30, 60)),
ADD CONSTRAINT valid_number_of_scenes CHECK (number_of_scenes > 0);

-- Ensure RLS is enabled
ALTER TABLE movie_settings ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
DROP POLICY IF EXISTS "Users can view own movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can create movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can update own movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can delete own movie settings" ON movie_settings;

CREATE POLICY "Users can view own movie settings"
  ON movie_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create movie settings"
  ON movie_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movie settings"
  ON movie_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own movie settings"
  ON movie_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
