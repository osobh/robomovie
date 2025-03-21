/*
  # Add Number of Scenes to Movie Settings

  1. Changes
    - Add number_of_scenes column to movie_settings table
    - Column is required and must be a positive integer

  2. Security
    - No changes to RLS policies needed
*/

-- Add number_of_scenes column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movie_settings' AND column_name = 'number_of_scenes'
  ) THEN
    ALTER TABLE movie_settings
    ADD COLUMN number_of_scenes integer NOT NULL,
    ADD CONSTRAINT valid_number_of_scenes CHECK (number_of_scenes > 0);
  END IF;
END $$;
