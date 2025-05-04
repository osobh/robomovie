-- Add completed field to scenes table
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;

-- Update existing scenes to have completed = true if they have a video_url
UPDATE scenes
SET completed = true
WHERE video_url IS NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_scenes_completed ON scenes(completed);
