-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('scripts', 'scripts', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('movies', 'movies', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('metadata', 'metadata', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('screenplays', 'screenplays', false);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Users can view own files in scripts bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'scripts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload to scripts bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'scripts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own files in scripts bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'scripts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files in scripts bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'scripts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Movies bucket policies
CREATE POLICY "Users can view own files in movies bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'movies' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload to movies bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'movies' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own files in movies bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'movies' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files in movies bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'movies' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Metadata bucket policies
CREATE POLICY "Users can view own files in metadata bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'metadata' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload to metadata bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'metadata' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own files in metadata bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'metadata' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files in metadata bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'metadata' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Screenplays bucket policies
CREATE POLICY "Users can view own files in screenplays bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'screenplays' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload to screenplays bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'screenplays' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own files in screenplays bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'screenplays' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files in screenplays bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'screenplays' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
