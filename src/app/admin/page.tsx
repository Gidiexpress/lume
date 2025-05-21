
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
import { UserProfileManager } from '@/components/admin/UserProfileManager'; // New Import
import { LayoutDashboard, Link2, LineChart, DollarSign, BrainCircuit, MessageSquare, LogOut, Loader2, ArrowLeft, ShieldAlert, UserCircle } from 'lucide-react'; // Added UserCircle
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
        if (profileError.code === 'PGRST116') {
          description = 'Your user profile was not found. Admin role cannot be verified. Please contact support.';
          toast({ title: 'Profile Not Found', description, variant: 'destructive' });
        } else if (profileError.message && profileError.message.includes('infinite recursion')) {
          description = 'Supabase RLS Policy Error: Infinite recursion detected. Please check your RLS policies on the "profiles" table. Ensure SELECT policies do not cause a loop by querying "profiles" within a policy for "profiles". Use `auth.uid() = id` for basic profile reads.';
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
        
        {/* Removed Supabase Setup Instructional Card */}

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mb-6"> {/* Adjusted grid for new tab */}
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
            <TabsTrigger value="profile"> {/* New Tab Trigger */}
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
          <TabsContent value="profile" className="mt-6"> {/* New Tab Content */}
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

    