/*
  # Add Genre Field to Movie Settings

  1. Changes
    - Add genre column to movie_settings table
    - Make genre column required

  2. Security
    - No changes to RLS policies needed
*/

-- Add genre column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movie_settings' AND column_name = 'genre'
  ) THEN
    ALTER TABLE movie_settings
    ADD COLUMN genre text NOT NULL;
  END IF;
END $$;
