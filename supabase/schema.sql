-- === Consolidated schema.sql for Robomovie (generated from all migrations) ===

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables (in dependency order)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  file_path text,
  file_size bigint,
  is_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS script_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  CONSTRAINT valid_file_size CHECK (size <= 5242880)
);

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

CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  script_id uuid REFERENCES scripts(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  duration interval,
  status text CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  preferred_llm text NOT NULL DEFAULT 'openai' CHECK (preferred_llm = ANY (ARRAY['openai', 'anthropic', 'deepseek'])),
  preferred_video_gen text NOT NULL DEFAULT 'pika' CHECK (preferred_video_gen = ANY (ARRAY['pika', 'runway', 'sora'])),
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
  UNIQUE (user_id),
  CONSTRAINT settings_twitter_handle_check CHECK (twitter_handle ~ '^@[A-Za-z0-9_]{1,15}$' OR twitter_handle IS NULL),
  CONSTRAINT settings_instagram_handle_check CHECK (instagram_handle ~ '^@[A-Za-z0-9_.]{1,30}$' OR instagram_handle IS NULL),
  CONSTRAINT settings_openai_key_check CHECK (openai_key ~ '^sk-[A-Za-z0-9]{32,}$' OR openai_key IS NULL),
  CONSTRAINT settings_anthropic_key_check CHECK (anthropic_key ~ '^sk-ant-[A-Za-z0-9]{32,}$' OR anthropic_key IS NULL)
);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text CHECK (type IN ('script', 'video', 'audio')) NOT NULL,
  size bigint NOT NULL,
  path text NOT NULL,
  mime_type text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movie_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  mode text NOT NULL,
  length_minutes integer NOT NULL,
  genre text NOT NULL,
  number_of_scenes integer NOT NULL,
  topic text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_mode CHECK (mode IN ('managed', 'self_service')),
  CONSTRAINT valid_length CHECK (length_minutes IN (1, 5, 15, 30, 60)),
  CONSTRAINT valid_number_of_scenes CHECK (number_of_scenes > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_script_id ON scenes(script_id);
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_script_id ON movies(script_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_script_files_user_id ON script_files(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_settings_user_id ON movie_settings(user_id);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_script_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name)
  VALUES (NEW.user_id, (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = NEW.user_id))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
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
  EXECUTE FUNCTION update_script_files_updated_at();

-- Trigger for user creation from auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to ensure user exists before movie_settings insert
DROP TRIGGER IF EXISTS ensure_user_exists_before_movie_settings ON movie_settings;
CREATE TRIGGER ensure_user_exists_before_movie_settings
  BEFORE INSERT ON movie_settings
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_exists();

-- RLS and Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow insert during signup" ON public.users;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Allow insert during signup" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Enable all access for service role" ON public.users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Scripts policies
DROP POLICY IF EXISTS "Users can view own scripts" ON scripts;
DROP POLICY IF EXISTS "Users can create scripts" ON scripts;
DROP POLICY IF EXISTS "Users can update own scripts" ON scripts;
DROP POLICY IF EXISTS "Users can delete own scripts" ON scripts;

CREATE POLICY "Users can view own scripts"
  ON scripts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create scripts"
  ON scripts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scripts"
  ON scripts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own scripts"
  ON scripts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Script files policies
DROP POLICY IF EXISTS "Users can view own script files" ON script_files;
DROP POLICY IF EXISTS "Users can insert own script files" ON script_files;
DROP POLICY IF EXISTS "Users can update own script files" ON script_files;
DROP POLICY IF EXISTS "Users can delete own script files" ON script_files;

CREATE POLICY "Users can view own script files"
  ON script_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own script files"
  ON script_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own script files"
  ON script_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own script files"
  ON script_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Scenes policies
DROP POLICY IF EXISTS "Users can view scenes of own scripts" ON scenes;
DROP POLICY IF EXISTS "Users can create scenes for own scripts" ON scenes;
DROP POLICY IF EXISTS "Users can update scenes of own scripts" ON scenes;

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
DROP POLICY IF EXISTS "Users can view own movies" ON movies;
DROP POLICY IF EXISTS "Users can create movies" ON movies;
DROP POLICY IF EXISTS "Users can update own movies" ON movies;

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
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can manage own settings" ON settings;

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
DROP POLICY IF EXISTS "Users can view own files" ON files;
DROP POLICY IF EXISTS "Users can create files" ON files;
DROP POLICY IF EXISTS "Users can update own files" ON files;
DROP POLICY IF EXISTS "Users can delete own files" ON files;

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

-- Movie settings policies
DROP POLICY IF EXISTS "Users can view own movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can create movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can update own movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can delete own movie settings" ON movie_settings;

CREATE POLICY "Users can view own movie settings" ON movie_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create movie settings" ON movie_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own movie settings" ON movie_settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own movie settings" ON movie_settings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Storage bucket and policies for scripts
INSERT INTO storage.buckets (id, name, public)
VALUES ('scripts', 'scripts', false)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets
SET public = false,
    avif_autodetection = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['text/plain'],
    owner = null
WHERE id = 'scripts';

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own scripts" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert own scripts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own scripts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own scripts" ON storage.objects;

CREATE POLICY "Users can read own scripts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'scripts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can insert own scripts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scripts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own scripts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'scripts'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'scripts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own scripts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scripts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
