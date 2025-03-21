import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate URL format
const isValidUrl = (urlString: string) => {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

// Provide more helpful error messages
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please ensure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set in your .env file. You can find these values in your Supabase project settings.'
  );
}

if (!isValidUrl(supabaseUrl)) {
  throw new Error(
    'Invalid Supabase URL format. The URL should start with https:// and be a valid URL from your Supabase project settings.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'supabase.auth.token',
    storage: window.localStorage
  }
});
