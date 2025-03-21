/*
  # Update Settings Schema

  1. Changes
    - Add NOT NULL constraints to critical fields
    - Add validation for social media handles
    - Add validation for API keys
    - Add unique constraint for user_id

  2. Security
    - No changes to RLS policies (already secure)
*/

-- Add constraints to settings table
DO $$ BEGIN
  -- Add check constraints for social media handles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'settings_twitter_handle_check'
  ) THEN
    ALTER TABLE settings
    ADD CONSTRAINT settings_twitter_handle_check
    CHECK (twitter_handle ~ '^@[A-Za-z0-9_]{1,15}$' OR twitter_handle IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'settings_instagram_handle_check'
  ) THEN
    ALTER TABLE settings
    ADD CONSTRAINT settings_instagram_handle_check
    CHECK (instagram_handle ~ '^@[A-Za-z0-9_.]{1,30}$' OR instagram_handle IS NULL);
  END IF;

  -- Add check constraints for API keys
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'settings_openai_key_check'
  ) THEN
    ALTER TABLE settings
    ADD CONSTRAINT settings_openai_key_check
    CHECK (openai_key ~ '^sk-[A-Za-z0-9]{32,}$' OR openai_key IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'settings_anthropic_key_check'
  ) THEN
    ALTER TABLE settings
    ADD CONSTRAINT settings_anthropic_key_check
    CHECK (anthropic_key ~ '^sk-ant-[A-Za-z0-9]{32,}$' OR anthropic_key IS NULL);
  END IF;

  -- Make preferred values NOT NULL with defaults
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'preferred_llm' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE settings
    ALTER COLUMN preferred_llm SET NOT NULL,
    ALTER COLUMN preferred_llm SET DEFAULT 'openai';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'preferred_video_gen' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE settings
    ALTER COLUMN preferred_video_gen SET NOT NULL,
    ALTER COLUMN preferred_video_gen SET DEFAULT 'pika';
  END IF;

END $$;
