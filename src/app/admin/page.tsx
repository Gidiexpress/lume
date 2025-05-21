
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js'; // Import User type from Supabase
import { supabase } from '@/lib/supabase/client'; // Import Supabase client

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { AffiliateLinkManager } from '@/components/admin/AffiliateLinkManager';
import { PaymentsDashboard } from '@/components/admin/PaymentsDashboard';
import { AiActivityMonitor } from '@/components/admin/AiActivityMonitor';
import { FeedbackManager } from '@/components/admin/FeedbackManager';
import { LayoutDashboard, Link2, LineChart, DollarSign, BrainCircuit, MessageSquare, LogOut, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false); // Simplified authorization for now
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/admin/login');
        setIsLoading(false);
        return;
      }
      
      setUser(session.user);
      
      // DEVELOPER NOTE: Implement proper admin role checking here.
      // This usually involves:
      // 1. Querying a 'user_roles' table in Supabase that links user_id to roles.
      // 2. Or, checking 'user_app_metadata' if roles are stored there (requires backend to set this).
      // For this prototype, we'll assume any authenticated user is authorized to see the dashboard.
      // In a real app, you'd set isAuthorized based on the role check.
      // Example: const isAdmin = await checkUserAdminRole(session.user.id); setIsAuthorized(isAdmin);
      
      // For now, if a user is logged in, we consider them "authorized" to see the page.
      // More robust checks should be implemented (e.g., via middleware and server-side checks).
      setIsAuthorized(true); 
      setIsLoading(false);
    });

    // Check initial auth state
    const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            router.replace('/admin/login');
            setIsLoading(false);
        } else {
            setUser(session.user);
            // See DEVELOPER NOTE above for role checking
            setIsAuthorized(true);
            setIsLoading(false);
        }
    };
    checkInitialSession();

    return () => {
      authListener?.unsubscribe();
    };
  }, [router, toast]);

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
      } else {
        router.replace('/admin/login'); 
      }
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
    // This typically means the user was redirected, but as a fallback:
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
         <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
         <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
         <p className="text-muted-foreground mb-6 text-center">
            You are not authorized to view this page or your session has expired.
         </p>
         <Button onClick={() => router.push('/admin/login')}>
            Go to Login
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
        <p className="text-sm text-muted-foreground mb-4">Logged in as: {user.email} (Admin Role Check Pending)</p>
        
        <Card className="mb-6 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700">
            <CardHeader>
                <CardTitle className="text-yellow-700 dark:text-yellow-300 text-lg flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" /> Important Security Note
                </CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-600 dark:text-yellow-400 text-sm space-y-2">
                <p>This admin dashboard currently allows access to any user authenticated via Supabase.</p>
                <p><strong>For production, you MUST implement robust admin role verification.</strong> This typically involves:</p>
                <ul className="list-disc list-inside pl-4">
                    <li>Creating a <code>user_roles</code> table in Supabase linking user IDs to roles (e.g., 'admin').</li>
                    <li>Querying this table after login (or via Next.js middleware) to confirm the user has admin privileges.</li>
                    <li>Securing Supabase Row Level Security (RLS) policies on your data tables to restrict access based on these roles.</li>
                </ul>
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
