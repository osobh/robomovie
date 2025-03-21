-- Update scripts bucket configuration
UPDATE storage.buckets
SET public = false,
    avif_autodetection = false,
    file_size_limit = 52428800, -- 50MB limit
    allowed_mime_types = ARRAY['text/plain'],
    owner = null -- Let RLS handle ownership
WHERE id = 'scripts';

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own scripts" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert own scripts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own scripts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own scripts" ON storage.objects;

-- Create updated storage policies
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
  AND (CASE 
    WHEN mimetype IS NOT NULL THEN mimetype = 'text/plain'
    ELSE true
  END)
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
  AND (CASE 
    WHEN mimetype IS NOT NULL THEN mimetype = 'text/plain'
    ELSE true
  END)
);

CREATE POLICY "Users can delete own scripts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scripts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
