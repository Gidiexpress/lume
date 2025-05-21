
'use client';

import React, { useState, useEffect, useActionState, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCircle, Save, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { updateUserProfile, type UserProfileState } from '@/app/admin-actions'; // Assuming you'll create this

const initialProfileState: UserProfileState = { success: false, message: null };

export function UserProfileManager() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const { toast } = useToast();

  const [updateState, updateFormAction, isUpdatePending] = useActionState(updateUserProfile, initialProfileState);

  useEffect(() => {
    const getCurrentUserAndProfile = async () => {
      setIsLoadingProfile(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116: "Searched for one row, but found 0"
            throw error;
          }
          if (profile) {
            setFullName(profile.full_name || '');
          }
        } catch (error: any) {
          toast({
            title: 'Error Fetching Profile',
            description: error.message || 'Could not load your profile data.',
            variant: 'destructive',
          });
        }
      }
      setIsLoadingProfile(false);
    };
    getCurrentUserAndProfile();
  }, [toast]);

  useEffect(() => {
    if (!isUpdatePending && updateState?.message) {
      toast({
        title: updateState.success ? 'Profile Updated' : 'Update Failed',
        description: updateState.message,
        variant: updateState.success ? 'default' : 'destructive',
      });
    }
  }, [updateState, isUpdatePending, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Error', description: 'User not found.', variant: 'destructive' });
      return;
    }
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
        updateFormAction(formData);
    });
  };

  if (isLoadingProfile) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <UserCircle className="mr-2 h-6 w-6 text-primary" />
            My Profile
          </CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <UserCircle className="mr-2 h-6 w-6 text-primary" />
            My Profile
          </CardTitle>
          <CardDescription>Update your personal information. Your email address is used for login and cannot be changed here.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName" // Important for FormData
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={isUpdatePending}
              />
            </div>
            {updateState?.message && !updateState.success && !isUpdatePending && (
              <p className="text-sm text-destructive flex items-center p-2 bg-destructive/10 rounded-md border border-destructive/30">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" /> {updateState.message}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatePending || isLoadingProfile}>
              {isUpdatePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
       <Card className="bg-blue-50 border-blue-200 shadow-md dark:bg-blue-900/30 dark:border-blue-700 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-300 text-sm flex items-center">
            <Info className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" /> Important Note on Roles
            </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-600 dark:text-blue-300/90 text-sm space-y-1">
           <p>
            This form allows you to update your display name. Your 'role' (e.g., admin) is managed separately and cannot be changed here.
           </p>
           <p>
            For Supabase, ensure your RLS policy on the <code>profiles</code> table allows users to update their own <code>full_name</code> and <code>updated_at</code> columns, but restricts changes to sensitive columns like <code>role</code>.
            Example RLS for update (more restrictive):
           </p>
            <pre className="mt-1 p-2 bg-stone-100 dark:bg-stone-800 rounded text-xs overflow-x-auto">
{`CREATE POLICY "Allow authenticated users to update their own name"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND (
  -- List allowed columns for update explicitly to protect 'role'
  (request.new_values->>'full_name' IS NOT NULL OR request.old_values->>'full_name' IS NOT NULL)
  -- Add other updatable columns here, e.g. avatar_url
));`}
            </pre>
            <p className="text-xs mt-1">Note: The SQL above is a simplified example; you might need to adjust it for your specific needs, such as allowing NULL values or checking specific column changes if you have more updatable fields.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    