import { useEffect } from 'react';
import { supabase } from './supabase';
import { useStore } from './store';

// 30 minutes in milliseconds
const SESSION_TIMEOUT = 30 * 60 * 1000;

export function useAuth() {
  const {
    auth,
    setUser,
    setAuthLoading,
    setAuthError,
    setAuthSuccess,
    setAuthMode
  } = useStore();
  const { user, isAuthenticated } = auth;

  interface AuthUser {
    id: string;
    email?: string;
    user_metadata: {
      full_name?: string;
    };
  }

  const ensureUserRecord = async (sessionUser: AuthUser) => {
    console.log('Checking for existing user record:', sessionUser.id);
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('id')
      .eq('id', sessionUser.id)
      .single();

    if (queryError) {
      console.error('Error querying user record:', queryError);
    }

    if (!existingUser) {
      console.log('Creating new user record for:', sessionUser.id);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: sessionUser.id,
          full_name: sessionUser.user_metadata.full_name || sessionUser.email?.split('@')[0]
        });

      if (insertError) {
        console.error('Error creating user record:', insertError);
        return false;
      }
      console.log('User record created successfully');
    } else {
      console.log('Existing user record found');
    }
    return true;
  };

  const resetSessionTimeout = () => {
    console.log('Resetting session timeout');
    clearTimeout(window.sessionTimeoutId);
    window.sessionTimeoutId = setTimeout(() => {
      console.log('Session timeout reached, logging out');
      logout();
    }, SESSION_TIMEOUT);
  };

  const clearExistingSession = async () => {
    console.log('Clearing existing session');
    await supabase.auth.signOut();
    setUser(null);
    clearTimeout(window.sessionTimeoutId);
  };

  useEffect(() => {
    console.log('Auth effect running, checking session');
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Got session:', session ? 'exists' : 'none');
      if (session) {
        console.log('Validating session user:', session.user.id);
        if (await ensureUserRecord(session.user)) {
          console.log('Setting user from session');
          setUser(session.user);
          resetSessionTimeout();
          console.log('Auth state after session restore:', useStore.getState().auth);
        } else {
          console.error('Failed to validate session user');
          await clearExistingSession();
        }
      } else {
        console.log('No session found, clearing user');
        setUser(null);
      }
    });

    // Set up auth state change subscription
    console.log('Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session ? 'session exists' : 'no session');
      if (session) {
        console.log('Validating auth state user:', session.user.id);
        if (await ensureUserRecord(session.user)) {
          console.log('Setting user from auth state change');
          setUser(session.user);
          resetSessionTimeout();
          console.log('Auth state after auth change:', useStore.getState().auth);
        } else {
          console.error('Failed to validate auth state user');
          await clearExistingSession();
        }
      } else {
        console.log('No session in auth state change, clearing user');
        setUser(null);
        clearTimeout(window.sessionTimeoutId);
      }
    });

    // Set up activity listeners for session timeout
    const resetTimeout = () => {
      if (isAuthenticated) {
        resetSessionTimeout();
      }
    };

    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keypress', resetTimeout);
    window.addEventListener('click', resetTimeout);
    window.addEventListener('scroll', resetTimeout);

    return () => {
      console.log('Cleaning up auth effect');
      subscription.unsubscribe();
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keypress', resetTimeout);
      window.removeEventListener('click', resetTimeout);
      window.removeEventListener('scroll', resetTimeout);
      clearTimeout(window.sessionTimeoutId);
    };
  }, [isAuthenticated, setUser]); // Added setUser to dependency array

  const login = async (email: string, password: string) => {
    console.log('Login attempt for:', email);
    setAuthLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', {
        success: !error,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message
      });

      if (error) throw error;

      if (!data.user || !data.session) {
        console.error('Login failed: Missing user or session data');
        throw new Error('Login failed');
      }

      console.log('Ensuring user record exists...');
      if (!await ensureUserRecord(data.user)) {
        console.error('Failed to create/verify user record in database');
        throw new Error('Failed to create user record');
      }

      console.log('Setting user in store:', data.user.id);
      setUser(data.user);
      console.log('Auth state after login:', useStore.getState().auth);

      console.log('Setting session timeout');
      resetSessionTimeout();

      return data.session;
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    console.log('Signup attempt for:', email);
    setAuthLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0],
          },
        },
      });

      console.log('Signup response:', {
        success: !error,
        hasUser: !!data?.user,
        error: error?.message
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('User already exists. Please login instead.');
        }
        throw error;
      }

      if (!data.user) {
        console.error('Signup failed: No user data');
        throw new Error('Failed to create user');
      }

      // IMPORTANT:  Do NOT automatically log in the user after signup.
      console.log('Signup successful, but not logging in automatically.');
      // Instead, set the success flag and let the component handle redirection.
      setAuthSuccess(true);

    } catch (error) {
      console.error('Signup error:', error);
      setAuthError(error instanceof Error ? error.message : 'Signup failed');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    console.log('Logout attempt');
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('Clearing user and session');
      setUser(null);
      clearTimeout(window.sessionTimeoutId);
      console.log('Auth state after logout:', useStore.getState().auth);
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError(error instanceof Error ? error.message : 'Logout failed');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    isAuthenticated,
    user,
    login,
    signup,
    logout,
    setAuthMode,
    isLogin: auth.isLogin,
    isSuccess: auth.isSuccess,
    error: auth.error,
    isLoading: auth.isLoading
  };
}
