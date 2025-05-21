
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { AffiliateLinkManager } from '@/components/admin/AffiliateLinkManager';
import { PaymentsDashboard } from '@/components/admin/PaymentsDashboard';
import { AiActivityMonitor } from '@/components/admin/AiActivityMonitor';
import { FeedbackManager } from '@/components/admin/FeedbackManager';
import { LayoutDashboard, Link2, LineChart, DollarSign, BrainCircuit, MessageSquare, LogOut, Loader2, ArrowLeft, AlertTriangle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const checkAdminRole = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAuthorized(false);
      setIsLoading(false);
      router.replace('/admin/login');
      return false;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles') 
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', JSON.stringify(profileError, null, 2));
        let description = 'Could not verify admin privileges. Please ensure your profile is set up correctly.';
        if (profileError.code === 'PGRST116') { // "Searched for one row, but found 0"
          description = 'Your user profile was not found. Admin role cannot be verified. Please contact support.';
          toast({ title: 'Profile Not Found', description, variant: 'destructive' });
        } else if (profileError.message && profileError.message.includes('infinite recursion')) {
          description = 'Supabase RLS Policy Error: Infinite recursion detected. Please check your RLS policies on the "profiles" table. Ensure policies do not cause a loop by querying the "profiles" table within a policy for "profiles". See the setup note on this page for correct RLS examples.';
           toast({ title: 'RLS Policy Error', description, variant: 'destructive' });
        } else {
          toast({ title: 'Authorization Error', description: `${description} (Error: ${profileError.message || 'Unknown Supabase error'})`, variant: 'destructive' });
        }
        await supabase.auth.signOut().catch(console.error);
        setIsAuthorized(false);
        const errorType = profileError.code === 'PGRST116' ? 'profile_not_found' : 'role_check_failed';
        router.replace(`/admin/login?error=${errorType}&message=${encodeURIComponent(description)}`);
        return false;
      }

      if (profile && profile.role === 'admin') {
        setIsAuthorized(true);
        return true;
      } else {
        const description = 'You do not have admin privileges. Access denied.';
        toast({ title: 'Access Denied', description, variant: 'destructive' });
        await supabase.auth.signOut().catch(console.error);
        setIsAuthorized(false);
        router.replace(`/admin/login?error=unauthorized&message=${encodeURIComponent(description)}`);
        return false;
      }
    } catch (err: any) {
      console.error("Unexpected error during role check:", JSON.stringify(err, null, 2));
      const description = 'An unexpected error occurred while verifying admin privileges.';
      toast({ title: 'Authorization Error', description, variant: 'destructive' });
      await supabase.auth.signOut().catch(console.error);
      setIsAuthorized(false);
      router.replace(`/admin/login?error=role_check_failed&message=${encodeURIComponent(description)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    const { data: authListenerData } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setIsAuthorized(false);
        router.replace('/admin/login');
        setIsLoading(false);
        return;
      }
      setUser(session.user);
      await checkAdminRole(session.user);
    });

    // Check initial auth state
    const checkInitialSession = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUser(null);
        setIsAuthorized(false);
        router.replace('/admin/login');
        setIsLoading(false);
      } else {
        setUser(session.user);
        await checkAdminRole(session.user);
      }
    };
    checkInitialSession();

    return () => {
      authListenerData.subscription?.unsubscribe();
    };
  }, [router, checkAdminRole]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out: ", error);
        toast({
          title: 'Logout Failed',
          description: error.message || 'An error occurred while trying to log out.',
          variant: 'destructive',
        });
      }
      // onAuthStateChange will handle redirect to /admin/login
    } catch (error: any) {
      console.error("Error signing out: ", error);
      toast({
        title: 'Logout Failed',
        description: error.message || 'An error occurred while trying to log out.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!user || !isAuthorized) {
    // This state should ideally be brief as the effect hook redirects.
    // This can serve as a fallback if redirection somehow fails or is delayed.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
         <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
         <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
         <p className="text-muted-foreground mb-6 text-center">
            You are not authorized to view this page or your session has expired. Please log in with an admin account.
         </p>
         <Button onClick={() => router.push('/admin/login')}>
            Go to Admin Login
         </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-4 px-6 shadow-md bg-card sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Lume Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-4">
            <p className="text-sm text-muted-foreground hidden md:block">Logged in as: {user.email}</p>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lume
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleLogout} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground mb-4 md:hidden">Logged in as: {user.email}</p>
        
        <Card className="mb-6 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700">
            <CardHeader>
                <CardTitle className="text-yellow-700 dark:text-yellow-300 text-lg flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" /> Important Supabase Setup for Admin Roles
                </CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-600 dark:text-yellow-400 text-sm space-y-3">
                <p>This admin dashboard verifies admin roles by checking a <code>profiles</code> table in Supabase for a <code>role</code> column set to <code>&apos;admin&apos;</code> for the logged-in user.</p>
                <p><strong>For this to work correctly, you MUST:</strong></p>
                <ol className="list-decimal list-inside pl-4 space-y-2">
                    <li>
                        <strong>Create the <code>profiles</code> Table:</strong> If not already done, create it with an <code>id</code> (UUID, foreign key to <code>auth.users.id</code>) and a <code>role</code> (TEXT) column.
                        <pre className="mt-1 p-2 bg-stone-100 dark:bg-stone-800 rounded text-xs overflow-x-auto">
{`CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`}
                        </pre>
                    </li>
                    <li>
                        <strong>Set Admin Role:</strong> For each admin user, add/update their row in <code>profiles</code>. Set their <code>id</code> to their Auth User ID and <code>role</code> to <code>&apos;admin&apos;</code>.
                         <pre className="mt-1 p-2 bg-stone-100 dark:bg-stone-800 rounded text-xs overflow-x-auto">
{`-- Replace 'YOUR_ADMIN_USER_ID' with the actual user ID
INSERT INTO public.profiles (id, role)
VALUES ('YOUR_ADMIN_USER_ID', 'admin')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;`}
                        </pre>
                    </li>
                    <li>
                        <strong>Setup Row Level Security (RLS) on <code>profiles</code>:</strong>
                        <p className="mt-1">The app needs to read the current user&apos;s own profile to check their role. Apply this RLS policy:</p>
                        <pre className="mt-1 p-2 bg-stone-100 dark:bg-stone-800 rounded text-xs overflow-x-auto">
{`-- Allows authenticated users to read their own profile
CREATE POLICY "Allow individual read access to own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);`}
                        </pre>
                        <p className="mt-2">
                            <strong>Avoid Infinite Recursion:</strong> An RLS policy for <code>SELECT</code> on <code>profiles</code> should NOT itself contain a subquery that reads from <code>profiles</code> without a specific condition to break the loop (like checking <code>auth.uid()</code>). If you previously had a policy like "Admins can read all profiles" that caused recursion, remove it or revise it using a security invoker function for the admin check.
                        </p>
                         <p className="mt-1">For basic profile creation by users (if needed):</p>
                        <pre className="mt-1 p-2 bg-stone-100 dark:bg-stone-800 rounded text-xs overflow-x-auto">
{`CREATE POLICY "Allow individual insert access to own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);`}
                        </pre>
                    </li>
                </ol>
                 <p className="mt-3">If you encounter authorization errors (like &quot;infinite recursion&quot; or &quot;profile not found&quot;), please double-check your <code>profiles</code> table data and RLS policies in your Supabase project.</p>
            </CardContent>
        </Card>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
            <TabsTrigger value="analytics">
              <LineChart className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="affiliate-links">
              <Link2 className="mr-2 h-4 w-4" />
              Affiliate Links
            </TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="mr-2 h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="ai-activity">
              <BrainCircuit className="mr-2 h-4 w-4" />
              AI Activity
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="mr-2 h-4 w-4" />
              Feedback
            </TabsTrigger>
          </TabsList>
          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>
          <TabsContent value="affiliate-links" className="mt-6">
            <AffiliateLinkManager />
          </TabsContent>
          <TabsContent value="payments" className="mt-6">
            <PaymentsDashboard />
          </TabsContent>
          <TabsContent value="ai-activity" className="mt-6">
            <AiActivityMonitor />
          </TabsContent>
          <TabsContent value="feedback" className="mt-6">
            <FeedbackManager />
          </TabsContent>
        </Tabs>
      </main>
       <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Lume Admin Panel. Secure access and full backend integration required for production.</p>
      </footer>
    </div>
  );
}
