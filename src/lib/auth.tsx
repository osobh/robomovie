import { useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { useStore } from "./store";

interface AuthUser {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
  };
}

interface AuthSession {
  user: AuthUser;
}

// 30 minutes in milliseconds
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Utility function to debounce state changes
function debounce<
  F extends (event: string, session: AuthSession | null) => Promise<void>
>(fn: F, ms = 300): (...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<F>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function useAuth() {
  const {
    auth,
    setUser,
    setAuthLoading,
    setAuthError,
    setAuthSuccess,
    setAuthMode,
  } = useStore();
  const { user, isAuthenticated } = auth;
  const isSignupInProgress = useRef(false);
  const authStateSubscription = useRef<{ unsubscribe: () => void } | null>(
    null
  );

  const ensureUserRecord = async (sessionUser: AuthUser) => {
    try {
      // Just verify the user exists - creation is handled by the trigger
      const { error: queryError } = await supabase
        .from("users")
        .select("id")
        .eq("id", sessionUser.id)
        .single();

      if (queryError) {
        console.error("Error querying user record:", queryError);
        // Don't throw on PGRST116 (no rows) as the trigger might not have completed yet
        if (queryError.code !== "PGRST116") {
          throw queryError;
        }
      }

      return true;
    } catch (error) {
      console.error("Error in ensureUserRecord:", error);
      return false;
    }
  };

  const resetSessionTimeout = () => {
    clearTimeout(window.sessionTimeoutId);
    window.sessionTimeoutId = setTimeout(() => {
      logout();
    }, SESSION_TIMEOUT);
  };

  const clearExistingSession = async () => {
    await supabase.auth.signOut();
    setUser(null);
    clearTimeout(window.sessionTimeoutId);
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        if (await ensureUserRecord(session.user)) {
          setUser(session.user);
          resetSessionTimeout();
        } else {
          console.error("Failed to validate session user");
          await clearExistingSession();
        }
      } else {
        setUser(null);
      }
    });

    // Set up auth state change subscription with debounced handler
    const handleAuthStateChange = debounce(
      async (_event: string, session: AuthSession | null) => {
        if (isSignupInProgress.current) {
          console.log("Auth state change ignored during signup");
          return;
        }

        if (session) {
          if (await ensureUserRecord(session.user)) {
            setUser(session.user);
            resetSessionTimeout();
          } else {
            await clearExistingSession();
          }
        } else {
          setUser(null);
          clearTimeout(window.sessionTimeoutId);
        }
      },
      300
    );

    // Clean up existing subscription before setting up new one
    if (authStateSubscription.current) {
      authStateSubscription.current.unsubscribe();
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    authStateSubscription.current = subscription;

    // Set up activity listeners for session timeout
    const resetTimeout = () => {
      if (isAuthenticated) {
        resetSessionTimeout();
      }
    };

    window.addEventListener("mousemove", resetTimeout);
    window.addEventListener("keypress", resetTimeout);
    window.addEventListener("click", resetTimeout);
    window.addEventListener("scroll", resetTimeout);

    return () => {
      if (authStateSubscription.current) {
        authStateSubscription.current.unsubscribe();
      }
      window.removeEventListener("mousemove", resetTimeout);
      window.removeEventListener("keypress", resetTimeout);
      window.removeEventListener("click", resetTimeout);
      window.removeEventListener("scroll", resetTimeout);
      clearTimeout(window.sessionTimeoutId);
    };
  }, [isAuthenticated, setUser]); // Added setUser to dependency array

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user || !data.session) {
        console.error("Login failed: Missing user or session data");
        throw new Error("Login failed");
      }

      if (!(await ensureUserRecord(data.user))) {
        console.error("Failed to create/verify user record in database");
        throw new Error("Failed to create user record");
      }

      setUser(data.user);
      resetSessionTimeout();

      return data.session;
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error instanceof Error ? error.message : "Login failed");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    isSignupInProgress.current = true;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split("@")[0],
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          throw new Error("User already exists. Please login instead.");
        }
        throw error;
      }

      if (!data.user) {
        console.error("Signup failed: No user data");
        throw new Error("Failed to create user");
      }

      // Do not automatically log in after signup
      // Set success flag and loading to false
      setAuthSuccess(true);
      setAuthLoading(false);
      return data.user;
    } catch (error) {
      console.error("Signup error:", error);
      setAuthError(error instanceof Error ? error.message : "Signup failed");
      setAuthLoading(false);
      throw error;
    } finally {
      isSignupInProgress.current = false;
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      clearTimeout(window.sessionTimeoutId);
    } catch (error) {
      console.error("Logout error:", error);
      setAuthError(error instanceof Error ? error.message : "Logout failed");
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
    isLoading: auth.isLoading,
  };
}
