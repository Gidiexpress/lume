
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
import { UserProfileManager } from '@/components/admin/UserProfileManager';
import { LayoutDashboard, Link2, LineChart, DollarSign, BrainCircuit, MessageSquare, LogOut, Loader2, ArrowLeft, ShieldAlert, UserCircle, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


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
        
        if (profileError.message && profileError.message.toLowerCase().includes('failed to fetch')) {
            description = 'Network Error: Could not connect to Supabase to verify admin role. Please check your internet connection and ensure Supabase URL/Anon Key are correct in your .env.local file.';
            toast({ title: 'Network Error', description, variant: 'destructive', duration: 10000 });
        } else if (profileError.code === 'PGRST116') { // "Searched for one row, but found 0"
          description = 'Your user profile was not found in the "profiles" table, or your RLS policies prevent reading it. Ensure your admin user has a profile with role="admin" and that RLS policy "Allow individual read access to own profile" is active and correct. Admin role cannot be verified. Please contact support or check Supabase setup.';
          toast({ title: 'Profile Not Found or Inaccessible for Role Check', description, variant: 'destructive', duration: 15000 });
        } else if (profileError.message && (profileError.message.includes('infinite recursion') || profileError.code === '42P17') ) {
          description = 'Supabase RLS Policy Error: Infinite recursion detected in a policy for the "profiles" table (Error 42P17). Please check your RLS policies. The policy for reading your own profile should be specific (auth.uid() = id). Policies allowing admins to select all profiles must use subqueries that can be resolved by this specific policy to avoid loops. Refer to the Admin Dashboard Setup Checklist card for detailed RLS examples to fix this.';
           toast({ title: 'RLS Policy Error (Infinite Recursion)', description, variant: 'destructive', duration: 15000 });
        } else {
          toast({ title: 'Authorization Error', description: `${description} (Error: ${profileError.message || 'Unknown Supabase error'})`, variant: 'destructive', duration: 10000 });
        }
        
        await supabase.auth.signOut().catch(console.error);
        setIsAuthorized(false);
        const errorType = profileError.message && profileError.message.toLowerCase().includes('failed to fetch') ? 'network_error' 
                        : profileError.code === 'PGRST116' ? 'profile_not_found_or_rls' 
                        : profileError.message && (profileError.message.includes('infinite recursion') || profileError.code === '42P17') ? 'rls_recursion'
                        : 'role_check_failed';
        router.replace(`/admin/login?error=${errorType}&message=${encodeURIComponent(description)}`);
        return false;
      }

      if (profile && profile.role === 'admin') {
        setIsAuthorized(true);
        return true;
      } else {
        const description = `Access Denied: Your profile does not have 'admin' role or profile is incomplete. Current role: '${profile?.role || 'not set'}'.`;
        toast({ title: 'Access Denied', description, variant: 'destructive', duration: 10000 });
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
    // The checkAdminRole function handles redirection and toasts for unauthorized users.
    // This return is a fallback or for when isLoading is false but authorization check is still pending or explicitly failed.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
         <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
         <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
         <p className="text-muted-foreground mb-6 text-center max-w-md">
            You are not authorized to view this page, your session has expired, or there was an issue verifying your admin privileges. Please log in with an admin account.
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
        
        <Card className="mb-8 bg-blue-50 border-blue-200 shadow-md dark:bg-blue-900/30 dark:border-blue-700">
            <CardHeader className="flex flex-row items-center">
                <Info className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                <CardTitle className="text-blue-700 dark:text-blue-300 text-base">Admin Dashboard Setup Checklist</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-600 dark:text-blue-300/90 text-sm space-y-2">
                <p>For full admin functionality and security, ensure the following Supabase setup:</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>
                        <strong>Environment Variables:</strong> <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> must be correctly set in your <code>.env.local</code> file.
                    </li>
                    <li>
                        <strong>`profiles` Table:</strong> A table named <code>profiles</code> exists in your Supabase public schema.
                        It must have an <code>id</code> column (UUID, primary key, foreign key to <code>auth.users.id</code>) and a <code>role</code> column (TEXT).
                    </li>
                    <li>
                        <strong>Admin User Record:</strong> The admin user must have an entry in the <code>profiles</code> table with their <code>id</code> matching their Auth user ID, and their <code>role</code> column set to <code>'admin'</code>.
                    </li>
                    <li>
                        <strong>Row Level Security (RLS) for `profiles`:</strong>
                        <ul className="list-circle list-inside pl-5 text-xs mt-1 space-y-1">
                            <li>Enable RLS on the <code>profiles</code> table.</li>
                            <li>
                                Crucial Policy for Users to Read Their Own Profile:
                                <pre className="mt-1 mb-1 p-1.5 bg-blue-100 dark:bg-blue-800/50 rounded text-xs overflow-x-auto">
{`CREATE POLICY "Allow individual read access to own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);`}
                                </pre>
                                This policy is specific and non-recursive. It's vital for resolving role checks without loops. If you can't log in as admin, ensure this policy is active and your admin user's `id` in `profiles` matches `auth.uid()` and `role` is `'admin'`.
                            </li>
                            <li>
                                Policy for Admins to Read All Profiles (Example):
                                 <pre className="mt-1 mb-1 p-1.5 bg-blue-100 dark:bg-blue-800/50 rounded text-xs overflow-x-auto">
{`CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p_check
    WHERE p_check.id = auth.uid() AND p_check.role = 'admin'
  )
);`}
                                </pre>
                                The subquery `EXISTS (...)` here will be resolved by the "Allow individual read access to own profile" policy for the `p_check` on `auth.uid()`, thus avoiding recursion.
                            </li>
                            <li>
                                <strong>Avoiding Infinite Recursion (Error 42P17):</strong>
                                The error occurs if a broad `SELECT` policy on `profiles` (e.g., an admin policy to select all profiles) has a `USING` clause that *itself* requires reading `profiles` in a way that re-triggers the same broad policy. The structure above with a specific "read own profile" policy and admin policies referencing it correctly helps prevent this.
                                Using JWT custom claims for role checks in RLS (e.g., `auth.jwt()->>'user_role' = 'admin'`) is another robust way to avoid table lookups for role verification within RLS, if you configure custom claims.
                            </li>
                        </ul>
                    </li>
                     <li>
                        <strong>Network Access:</strong> Ensure your browser and deployment environment can reach your Supabase project URL. Check for firewalls, proxies, or ad-blockers if you encounter "Failed to fetch" errors.
                    </li>
                    <li>
                        <strong>RLS for other tables (e.g., `affiliateLinks`, `user_activity_logs`):</strong> Ensure RLS policies on these tables correctly use `(EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))` in their `USING` and `WITH CHECK` clauses for admin-only operations. These subqueries rely on the non-recursive "Allow individual read access to own profile" policy on `profiles`.
                    </li>
                </ul>
                <p className="mt-3">If you see "Failed to fetch" errors, verify your internet connection and Supabase URL/keys. If you see "Profile Not Found" or "Access Denied" due to role, verify `profiles` table data and RLS (especially the "Allow individual read access to own profile" policy). For "Infinite Recursion" (42P17), meticulously review your `SELECT` RLS policies on the `profiles` table using the examples above as a guide.</p>
            </CardContent>
        </Card>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mb-6">
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
            <TabsTrigger value="profile">
              <UserCircle className="mr-2 h-4 w-4" />
              My Profile
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
          <TabsContent value="profile" className="mt-6">
            <UserProfileManager />
          </TabsContent>
        </Tabs>
      </main>
       <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Lume Admin Panel. Secure access and full backend integration required for production.</p>
      </footer>
    </div>
  );
}

