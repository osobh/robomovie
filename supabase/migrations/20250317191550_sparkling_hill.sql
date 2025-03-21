/*
  # Script Storage System

  1. New Tables
    - `scripts` - Stores script content and metadata
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `title` (text)
      - `content` (text)
      - `file_path` (text)
      - `file_size` (bigint)
      - `is_generated` (boolean)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on scripts table
    - Add policies for secure access
    - Only authenticated users can access their own scripts
*/

-- Create scripts table if it doesn't exist
CREATE TABLE IF NOT EXISTS scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  file_path text,
  file_size bigint,
  is_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);

-- Enable RLS
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scripts' AND policyname = 'Users can view own scripts'
  ) THEN
    CREATE POLICY "Users can view own scripts"
      ON scripts
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scripts' AND policyname = 'Users can create scripts'
  ) THEN
    CREATE POLICY "Users can create scripts"
      ON scripts
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scripts' AND policyname = 'Users can update own scripts'
  ) THEN
    CREATE POLICY "Users can update own scripts"
      ON scripts
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scripts' AND policyname = 'Users can delete own scripts'
  ) THEN
    CREATE POLICY "Users can delete own scripts"
      ON scripts
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_scripts_updated_at'
  ) THEN
    CREATE TRIGGER update_scripts_updated_at
      BEFORE UPDATE ON scripts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
