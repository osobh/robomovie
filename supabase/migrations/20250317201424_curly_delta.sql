/*
  # Fix movie_settings RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new, properly scoped RLS policies for all operations
    - Ensure policies use auth.uid() for user identification

  2. Security
    - Enable RLS on the table
    - Add policies for SELECT, INSERT, UPDATE, and DELETE operations
    - Restrict access to only authenticated users
    - Users can only access their own records
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can create movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can update own movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can delete own movie settings" ON movie_settings;

-- Ensure RLS is enabled
ALTER TABLE movie_settings ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can view own movie settings"
ON movie_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create movie settings"
ON movie_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movie settings"
ON movie_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own movie settings"
ON movie_settings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
