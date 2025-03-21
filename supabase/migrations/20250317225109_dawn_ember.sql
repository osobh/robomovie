/*
  # Update Movie Settings Schema

  1. Changes
    - Remove provider_tier from movie_settings table
    - Remove provider and llm_provider from movie_settings table
    - Update constraints accordingly

  2. Security
    - Maintain existing RLS policies
*/

-- Remove columns from movie_settings
ALTER TABLE movie_settings
DROP COLUMN IF EXISTS provider_tier,
DROP COLUMN IF EXISTS provider,
DROP COLUMN IF EXISTS llm_provider;

-- Update constraints
ALTER TABLE movie_settings
DROP CONSTRAINT IF EXISTS valid_provider,
DROP CONSTRAINT IF EXISTS valid_provider_tier,
DROP CONSTRAINT IF EXISTS valid_llm_provider;

-- Add new constraints
ALTER TABLE movie_settings
ADD CONSTRAINT valid_mode CHECK (mode IN ('managed', 'self_service')),
ADD CONSTRAINT valid_length CHECK (length_minutes IN (1, 5, 15, 30, 60));
