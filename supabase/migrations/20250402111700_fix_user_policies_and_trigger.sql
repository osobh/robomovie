-- Drop existing policies
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

-- Create function to ensure user exists
CREATE OR REPLACE FUNCTION ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert the user if they don't exist
  INSERT INTO public.users (id, full_name)
  VALUES (NEW.user_id, (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = NEW.user_id))
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to ensure user exists before movie_settings insert
DROP TRIGGER IF EXISTS ensure_user_exists_before_movie_settings ON movie_settings;
CREATE TRIGGER ensure_user_exists_before_movie_settings
  BEFORE INSERT ON movie_settings
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_exists();
