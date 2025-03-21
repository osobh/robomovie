/*
  # Fix RLS Policies and Settings

  1. Changes
    - Add RLS policies for users table with existence checks
    - Update settings table constraints
    - Fix settings table RLS policies
    - Add trigger for settings updated_at

  2. Security
    - Ensure users can only access their own data
    - Maintain data integrity with proper constraints
*/

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile'
  ) THEN
    DROP POLICY "Users can view own profile" ON users;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    DROP POLICY "Users can update own profile" ON users;
  END IF;
END $$;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure settings table has proper constraints
ALTER TABLE settings
DROP CONSTRAINT IF EXISTS settings_preferred_llm_check,
DROP CONSTRAINT IF EXISTS settings_preferred_video_gen_check;

ALTER TABLE settings
ADD CONSTRAINT settings_preferred_llm_check
  CHECK (preferred_llm = ANY (ARRAY['openai', 'anthropic', 'deepseek'])),
ADD CONSTRAINT settings_preferred_video_gen_check
  CHECK (preferred_video_gen = ANY (ARRAY['pika', 'runway', 'sora']));

-- Drop existing settings policies
DROP POLICY IF EXISTS "Users can manage own settings" ON settings;
DROP POLICY IF EXISTS "Users can view own settings" ON settings;

-- Create new settings policies
CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings"
  ON settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure settings has updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
