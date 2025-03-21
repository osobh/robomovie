/*
  # Update Movie and LLM Providers

  1. Changes
    - Update valid providers in movie_settings table
    - Split providers into movie_provider and llm_provider
    - Update constraints to enforce valid providers

  2. Security
    - Maintain existing RLS policies
*/

-- Modify the movie_settings table to add llm_provider
ALTER TABLE movie_settings
ADD COLUMN llm_provider text;

-- Update the constraints
ALTER TABLE movie_settings
DROP CONSTRAINT IF EXISTS valid_provider;

ALTER TABLE movie_settings
ADD CONSTRAINT valid_movie_provider CHECK (
  (mode = 'managed' AND provider IS NULL) OR
  (mode = 'self_service' AND provider IN ('runway', 'luma', 'kling', 'pika'))
);

ALTER TABLE movie_settings
ADD CONSTRAINT valid_llm_provider CHECK (
  (mode = 'managed' AND llm_provider IS NULL) OR
  (mode = 'self_service' AND llm_provider IN ('openai', 'anthropic', 'deepseek', 'ollama', 'baidu'))
);
