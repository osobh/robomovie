-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies using auth.uid()
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Add policy to allow new user creation during signup
CREATE POLICY "Allow insert during signup" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Grant additional permissions to authenticated role
GRANT INSERT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;
