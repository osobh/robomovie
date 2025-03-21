/*
  # Initial Schema Setup

  1. New Tables
    - `users`
      - Extended user profile data
      - Links to auth.users
    - `scripts`
      - Stores uploaded and generated scripts
    - `scenes`
      - Breakdown of scripts into individual scenes
    - `movies`
      - Final assembled movies
    - `settings`
      - User preferences and API keys
    - `files`
      - Tracks all uploaded/generated files

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table to extend auth.users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create scripts table
CREATE TABLE IF NOT EXISTS scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  file_path text,
  file_size bigint,
  is_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid REFERENCES scripts(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  scene_number integer NOT NULL,
  location text,
  time_of_day text,
  characters text[],
  description text,
  frame_count integer,
  tone text,
  technical_notes text,
  video_url text,
  video_generator text CHECK (video_generator IN ('runway', 'pika', 'sora')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  script_id uuid REFERENCES scripts(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  duration interval,
  status text CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  preferred_llm text CHECK (preferred_llm IN ('openai', 'anthropic', 'deepseek')) DEFAULT 'openai',
  preferred_video_gen text CHECK (preferred_video_gen IN ('pika', 'runway', 'sora')) DEFAULT 'pika',
  openai_key text,
  anthropic_key text,
  deepseek_key text,
  pika_key text,
  runway_key text,
  sora_key text,
  twitter_handle text,
  instagram_handle text,
  youtube_channel text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text CHECK (type IN ('script', 'video', 'audio')) NOT NULL,
  size bigint NOT NULL,
  path text NOT NULL,
  mime_type text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Scripts policies
CREATE POLICY "Users can view own scripts"
  ON scripts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create scripts"
  ON scripts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts"
  ON scripts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts"
  ON scripts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Scenes policies
CREATE POLICY "Users can view scenes of own scripts"
  ON scenes FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM scripts
    WHERE scripts.id = scenes.script_id
    AND scripts.user_id = auth.uid()
  ));

CREATE POLICY "Users can create scenes for own scripts"
  ON scenes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM scripts
    WHERE scripts.id = scenes.script_id
    AND scripts.user_id = auth.uid()
  ));

CREATE POLICY "Users can update scenes of own scripts"
  ON scenes FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM scripts
    WHERE scripts.id = scenes.script_id
    AND scripts.user_id = auth.uid()
  ));

-- Movies policies
CREATE POLICY "Users can view own movies"
  ON movies FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create movies"
  ON movies FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own movies"
  ON movies FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Settings policies
CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own settings"
  ON settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Files policies
CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own files"
  ON files FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_script_id ON scenes(script_id);
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_script_id ON movies(script_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scripts_updated_at
  BEFORE UPDATE ON scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at
  BEFORE UPDATE ON scenes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON movies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
