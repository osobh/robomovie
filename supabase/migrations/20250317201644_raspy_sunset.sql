/*
  # Create Development User

  1. Changes
    - Create development user in auth.users if it doesn't exist
    - Insert development user into public.users table
    - Set consistent UUID and user details

  2. Security
    - Maintains referential integrity with auth.users
    - Uses proper error handling
*/

-- Create the development user in auth.users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000'
  ) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'movie@movie.com',
      crypt('movie', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Robert Redford"}',
      false,
      'authenticated'
    );
  END IF;
END $$;

-- Insert the development user into public.users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000'
  ) THEN
    INSERT INTO public.users (
      id,
      full_name,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'Robert Redford',
      now(),
      now()
    );
  END IF;
END $$;
