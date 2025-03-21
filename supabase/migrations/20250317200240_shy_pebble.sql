/*
  # Add movie creation tables and settings

  1. New Tables
    - `movie_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `title` (text)
      - `mode` (text, either 'managed' or 'self_service')
      - `length_minutes` (integer)
      - `provider` (text, nullable)
      - `provider_tier` (text, nullable)
      - `api_key` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `movie_settings` table
    - Add policies for authenticated users to manage their own settings

  3. Changes
    - Add constraints for valid movie lengths and modes
*/

-- Create movie_settings table
CREATE TABLE IF NOT EXISTS movie_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  mode text NOT NULL,
  length_minutes integer NOT NULL,
  provider text,
  provider_tier text,
  api_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_mode CHECK (mode IN ('managed', 'self_service')),
  CONSTRAINT valid_length CHECK (length_minutes IN (1, 5, 15, 30, 60)),
  CONSTRAINT valid_provider CHECK (
    (mode = 'managed' AND provider IS NULL) OR
    (mode = 'self_service' AND provider IN ('openai', 'anthropic', 'deepseek', 'pika', 'runway', 'sora'))
  ),
  CONSTRAINT valid_provider_tier CHECK (
    (mode = 'managed' AND provider_tier IS NULL) OR
    (mode = 'self_service' AND provider_tier IN ('basic', 'pro', 'enterprise'))
  ),
  CONSTRAINT api_key_required_for_self_service CHECK (
    (mode = 'managed' AND api_key IS NULL) OR
    (mode = 'self_service' AND api_key IS NOT NULL)
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_movie_settings_user_id ON movie_settings(user_id);

-- Enable RLS
ALTER TABLE movie_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own movie settings"
  ON movie_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create movie settings"
  ON movie_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movie settings"
  ON movie_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own movie settings"
  ON movie_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_movie_settings_updated_at
  BEFORE UPDATE ON movie_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
