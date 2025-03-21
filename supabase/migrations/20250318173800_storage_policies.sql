-- Create scripts bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('scripts', 'scripts', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the scripts bucket
UPDATE storage.buckets
SET public = false,
    avif_autodetection = false,
    file_size_limit = 52428800, -- 50MB limit
    allowed_mime_types = ARRAY['text/plain']
WHERE id = 'scripts';

-- Policy to allow users to read their own scripts
CREATE POLICY "Users can read own scripts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'scripts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow users to insert their own scripts
CREATE POLICY "Users can insert own scripts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scripts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to update their own scripts
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

-- Policy to allow users to delete their own scripts
CREATE POLICY "Users can delete own scripts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scripts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
