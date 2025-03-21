/*
  # Fix RLS Policies and Settings

  1. Changes
    - Add default settings for dev user
    - Fix RLS policies for settings table
    - Add missing settings record for dev user

  2. Security
    - Maintain RLS policies
    - Ensure dev user has proper access
*/

-- Create default settings for dev user
INSERT INTO settings (
  user_id,
  preferred_llm,
  preferred_video_gen,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'openai',
  'pika',
  now(),
  now()
)
ON CONFLICT (user_id) DO NOTHING;

-- Enable RLS on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own settings" ON settings;
DROP POLICY IF EXISTS "Users can view own settings" ON settings;

-- Create new policies with proper checks
CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own settings"
  ON settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure dev user exists in users table
INSERT INTO users (
  id,
  full_name,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Robert Redford',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies with proper checks
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
