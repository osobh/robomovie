-- Add topic column to movie_settings table
ALTER TABLE movie_settings
ADD COLUMN topic TEXT;

-- Update RLS policies to include topic
ALTER POLICY "Users can only access their own movie settings" ON movie_settings
USING (auth.uid() = user_id);

ALTER POLICY "Users can only update their own movie settings" ON movie_settings
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
