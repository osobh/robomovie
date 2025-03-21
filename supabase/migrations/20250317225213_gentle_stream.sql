/*
  # Update Movie Settings Schema

  1. Changes
    - Remove provider-related columns and constraints
    - Update mode and length constraints
    - Handle existing constraints gracefully

  2. Security
    - Maintain existing RLS policies
*/

-- Remove columns if they exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movie_settings' AND column_name = 'provider_tier'
  ) THEN
    ALTER TABLE movie_settings DROP COLUMN provider_tier;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movie_settings' AND column_name = 'provider'
  ) THEN
    ALTER TABLE movie_settings DROP COLUMN provider;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movie_settings' AND column_name = 'llm_provider'
  ) THEN
    ALTER TABLE movie_settings DROP COLUMN llm_provider;
  END IF;
END $$;

-- Drop existing constraints if they exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'movie_settings' AND constraint_name = 'valid_provider'
  ) THEN
    ALTER TABLE movie_settings DROP CONSTRAINT valid_provider;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'movie_settings' AND constraint_name = 'valid_provider_tier'
  ) THEN
    ALTER TABLE movie_settings DROP CONSTRAINT valid_provider_tier;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'movie_settings' AND constraint_name = 'valid_llm_provider'
  ) THEN
    ALTER TABLE movie_settings DROP CONSTRAINT valid_llm_provider;
  END IF;

  -- Only add constraints if they don't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'movie_settings' AND constraint_name = 'valid_mode'
  ) THEN
    ALTER TABLE movie_settings
    ADD CONSTRAINT valid_mode CHECK (mode IN ('managed', 'self_service'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'movie_settings' AND constraint_name = 'valid_length'
  ) THEN
    ALTER TABLE movie_settings
    ADD CONSTRAINT valid_length CHECK (length_minutes IN (1, 5, 15, 30, 60));
  END IF;
END $$;
