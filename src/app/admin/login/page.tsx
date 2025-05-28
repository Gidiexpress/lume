'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import {
  Loader2,
  LogIn,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const router = useRouter();

  // Handle auth errors passed via query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authErrorType = params.get('error');
    const authErrorMessage = params.get('message');

    if (authErrorMessage) {
      setError(decodeURIComponent(authErrorMessage));
    } else if (authErrorType === 'unauthorized') {
      setError('Access Denied: You are not authorized to access the admin dashboard.');
    } else if (authErrorType === 'role_check_failed') {
      setError('Authorization Error: Could not verify admin privileges. Please contact support.');
    }

    if (authErrorType || authErrorMessage) {
      const currentPath = window.location.pathname;
      router.replace(currentPath);
    }
  }, [router]);

  // Check existing session or auth state changes
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.replace('/admin');
      } else {
        setIsCheckingAuth(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.replace('/admin');
      } else {
        setIsCheckingAuth(false);
      }
    });

    checkSession();

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data?.user) {
        router.replace('/admin');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      setError(err.message || 'Unexpected error during login.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <ShieldAlert className="mr-2 h-6 w-6 text-primary" />
            Lume Admin Login
          </CardTitle>
          <CardDescription>Access to the Lume administration panel.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Sign In
            </Button>
            {error && (
              <p className="text-sm text-destructive flex items-center p-3 bg-destructive/10 rounded-md border border-destructive/30">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                {error}
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary underline">
          Back to Lume Home
        </Link>
      </p>
    </div>
  );
}
