/*
  Comprehensive Schema for RoboMovie
  
  Tables:
  1. users - Extended user profiles
  2. movie_settings - Movie configuration
  3. scripts - Script content and metadata
  4. scenes - Scene breakdowns
  5. movies - Final assembled movies
  6. settings - User preferences and API keys
  7. files - File tracking system
  8. script_files - Script file metadata
*/

-- Create auth schema and base users table (for standalone PostgreSQL)
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  raw_user_meta_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create authenticated role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
END;
$$;

-- Grant privileges to authenticated role
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table to extend auth.users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create movie_settings table
CREATE TABLE IF NOT EXISTS movie_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  genre text NOT NULL,
  topic text,
  mode text NOT NULL,
  length_minutes integer NOT NULL,
  number_of_scenes integer NOT NULL,
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

-- Create scripts table
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
  openai_key text CHECK (openai_key ~ '^sk-[A-Za-z0-9]{32,}$' OR openai_key IS NULL),
  anthropic_key text CHECK (anthropic_key ~ '^sk-ant-[A-Za-z0-9]{32,}$' OR anthropic_key IS NULL),
  deepseek_key text,
  pika_key text,
  runway_key text,
  sora_key text,
  twitter_handle text CHECK (twitter_handle ~ '^@[A-Za-z0-9_]{1,15}$' OR twitter_handle IS NULL),
  instagram_handle text CHECK (instagram_handle ~ '^@[A-Za-z0-9_.]{1,30}$' OR instagram_handle IS NULL),
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

-- Create script_files table
CREATE TABLE IF NOT EXISTS script_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  content_type text NOT NULL,
  size bigint NOT NULL,
  path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_content_types CHECK (
    content_type = ANY (ARRAY[
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ])
  ),
  CONSTRAINT valid_file_size CHECK (size <= 5242880) -- 5MB limit
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_movie_settings_user_id ON movie_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_script_id ON scenes(script_id);
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_script_id ON movies(script_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_script_files_user_id ON script_files(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_files ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (using current_user as a substitute for auth.uid())
-- Note: Replace with auth.uid() if using Supabase

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated
  USING (id::text = current_user);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (id::text = current_user);

-- Movie Settings policies
CREATE POLICY "Users can view own movie settings" ON movie_settings
  FOR SELECT TO authenticated
  USING (user_id::text = current_user);

CREATE POLICY "Users can create movie settings" ON movie_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id::text = current_user);

CREATE POLICY "Users can update own movie settings" ON movie_settings
  FOR UPDATE TO authenticated
  USING (user_id::text = current_user);

CREATE POLICY "Users can delete own movie settings" ON movie_settings
  FOR DELETE TO authenticated
  USING (user_id::text = current_user);

-- Scripts policies
CREATE POLICY "Users can view own scripts" ON scripts
  FOR SELECT TO authenticated
  USING (user_id::text = current_user);

CREATE POLICY "Users can create scripts" ON scripts
  FOR INSERT TO authenticated
  WITH CHECK (user_id::text = current_user);

CREATE POLICY "Users can update own scripts" ON scripts
  FOR UPDATE TO authenticated
  USING (user_id::text = current_user);

CREATE POLICY "Users can delete own scripts" ON scripts
  FOR DELETE TO authenticated
  USING (user_id::text = current_user);

-- Scenes policies
CREATE POLICY "Users can view scenes of own scripts" ON scenes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM scripts
    WHERE scripts.id = scenes.script_id
    AND scripts.user_id::text = current_user
  ));

CREATE POLICY "Users can create scenes for own scripts" ON scenes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM scripts
    WHERE scripts.id = scenes.script_id
    AND scripts.user_id::text = current_user
  ));

CREATE POLICY "Users can update scenes of own scripts" ON scenes
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM scripts
    WHERE scripts.id = scenes.script_id
    AND scripts.user_id::text = current_user
  ));

-- Movies policies
CREATE POLICY "Users can view own movies" ON movies
  FOR SELECT TO authenticated
  USING (user_id::text = current_user);

CREATE POLICY "Users can create movies" ON movies
  FOR INSERT TO authenticated
  WITH CHECK (user_id::text = current_user);

CREATE POLICY "Users can update own movies" ON movies
  FOR UPDATE TO authenticated
  USING (user_id::text = current_user);

-- Settings policies
CREATE POLICY "Users can view own settings" ON settings
  FOR SELECT TO authenticated
  USING (user_id::text = current_user);

CREATE POLICY "Users can manage own settings" ON settings
  FOR ALL TO authenticated
  USING (user_id::text = current_user)
  WITH CHECK (user_id::text = current_user);

-- Files policies
CREATE POLICY "Users can view own files" ON files
  FOR SELECT TO authenticated
  USING (user_id::text = current_user);

CREATE POLICY "Users can create files" ON files
  FOR INSERT TO authenticated
  WITH CHECK (user_id::text = current_user);

CREATE POLICY "Users can update own files" ON files
  FOR UPDATE TO authenticated
  USING (user_id::text = current_user);

CREATE POLICY "Users can delete own files" ON files
  FOR DELETE TO authenticated
  USING (user_id::text = current_user);

-- Script Files policies
CREATE POLICY "Users can view own script files" ON script_files
  FOR SELECT TO authenticated
  USING (user_id::text = current_user);

CREATE POLICY "Users can insert own script files" ON script_files
  FOR INSERT TO authenticated
  WITH CHECK (user_id::text = current_user);

CREATE POLICY "Users can update own script files" ON script_files
  FOR 최대UPDATE TO authenticated
  USING (user_id::text = current_user);

CREATE POLICY "Users can delete own script files" ON script_files
  FOR DELETE TO authenticated
  USING (user_id::text = current_user);

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create user records for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth user trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movie_settings_updated_at
  BEFORE UPDATE ON movie_settings
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

CREATE TRIGGER update_script_files_updated_at
  BEFORE UPDATE ON script_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();