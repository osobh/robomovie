import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export function AuthDialog() {
  const navigate = useNavigate();
  const {
    login,
    signup,
    isAuthenticated,
    isLogin,
    isSuccess,
    error,
    isLoading,
    setAuthMode
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Clear any existing session when mounting in signup mode
  useEffect(() => {
      console.log('Auth dialog mounted, ensuring no session exists');
      supabase.auth.signOut();
  }, [isLogin]); // Run whenever isLogin changes

  // Handle navigation when auth state changes
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, isLogin });
    if (isAuthenticated && isLogin) {
      console.log('Navigating to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLogin, navigate]);

    useEffect(() => {
    if (isSuccess) {
      console.log('Signup successful, redirecting to login');
      setAuthMode(true); // Switch to login mode
    }
  }, [isSuccess, setAuthMode]);


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Handling auth submit:', { isLogin, email });

    try {
      if (isLogin) {
        console.log('Attempting login');
        await login(email, password);
        console.log('Login successful, auth state:', useStore.getState().auth);
      } else {
        console.log('Attempting signup');
        await signup(email, password);
        console.log('Signup successful');
        // No longer setting email/password to '' here, as we redirect
      }
    } catch (err) {
      console.error('Auth error in component:', err);
    }
  };

  const switchMode = () => {
    console.log('Switching auth mode from:', isLogin);
    setAuthMode(!isLogin);
    setPassword('');
    setEmail('');
    console.log('Auth mode switched to:', !isLogin);
  };

  return (
    <DialogContent className="bg-[#1A1A1A] text-white">
      <DialogHeader>
        <DialogTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</DialogTitle>
        <DialogDescription>
          {isLogin ? 'Sign in to your account' : 'Sign up for a new account'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleAuth} className="space-y-4">
        {error && (
          <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-md p-3">
            {error}
          </div>
        )}
        {isSuccess && (
          <div className="space-y-4">
            <div className="text-green-500 text-sm bg-green-500/10 border border-green-500/20 rounded-md p-3">
              Account created successfully! Please sign in with your credentials.
            </div>
            {/* Removed the "Continue to Login" button, automatic redirection is handled by useEffect */}
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
            placeholder="your@email.com"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>
        <div className="flex flex-col gap-2">
          {!isSuccess && (
            <>
              <Button
                type="submit"
                className="bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-[#1ABC9C]"
                onClick={switchMode}
                disabled={isLoading}
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Button>
            </>
          )}
        </div>
      </form>
    </DialogContent>
  );
}
