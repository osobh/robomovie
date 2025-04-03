-- Drop existing movie settings policies
DROP POLICY IF EXISTS "Users can view own movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can create movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can update own movie settings" ON movie_settings;
DROP POLICY IF EXISTS "Users can delete own movie settings" ON movie_settings;

-- Recreate policies using auth.uid()
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
