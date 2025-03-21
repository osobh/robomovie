-- Enable RLS on scripts table (if not already enabled)
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own scripts
CREATE POLICY "Users can read own scripts"
ON scripts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy to allow users to create scripts
CREATE POLICY "Users can create scripts"
ON scripts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy to allow users to update their own scripts
CREATE POLICY "Users can update own scripts"
ON scripts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Policy to allow users to delete their own scripts
CREATE POLICY "Users can delete own scripts"
ON scripts FOR DELETE
TO authenticated
USING (user_id = auth.uid());
