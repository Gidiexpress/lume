
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { AffiliateLinkManager } from '@/components/admin/AffiliateLinkManager';
import { PaymentsDashboard } from '@/components/admin/PaymentsDashboard';
import { AiActivityMonitor } from '@/components/admin/AiActivityMonitor';
import { FeedbackManager } from '@/components/admin/FeedbackManager';
import { LayoutDashboard, Link2, LineChart, DollarSign, BrainCircuit, MessageSquare, LogOut, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const [user, setUser] = useState(auth.currentUser);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace('/admin/login');
      } else {
        setUser(currentUser);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/admin/login'); // Redirect to login page after logout
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally, show a toast message for logout failure
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the redirect in onAuthStateChanged,
    // but it's a fallback.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
         <p className="text-lg mb-4">Redirecting to login...</p>
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground mb-4">Logged in as: {user.email}</p>
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
