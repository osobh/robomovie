-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type text CHECK (type IN ('script-upload', 'storyboard-complete', 'video-rendering', 'video-complete')) NOT NULL,
  title text NOT NULL,
  status text,
  metadata jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON activities TO authenticated;
