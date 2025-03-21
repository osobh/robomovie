/*
  # Create Script Storage System

  1. New Tables
    - `script_files` - Stores metadata about uploaded script files
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `filename` (text)
      - `content_type` (text)
      - `size` (bigint)
      - `path` (text)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on script_files table
    - Add policies for secure access
    - Only authenticated users can access their own files
*/

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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_script_files_user_id ON script_files(user_id);

-- Enable RLS
ALTER TABLE script_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own script files"
  ON script_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own script files"
  ON script_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own script files"
  ON script_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own script files"
  ON script_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_script_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_script_files_updated_at
  BEFORE UPDATE ON script_files
  FOR EACH ROW
  EXECUTE FUNCTION update_script_files_updated_at();
