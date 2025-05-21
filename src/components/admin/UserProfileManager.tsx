
'use client';

import React, { useState, useEffect, useActionState, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Loader2, UserCircle, Save, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { updateUserProfile, type UserProfileState } from '@/app/admin-actions'; 

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
            // Check if it's a "profile not found" error due to RLS (common if RLS is too restrictive or profile doesn't exist)
             if (error.code === 'PGRST000' || error.code === 'PGRST116') {
                console.warn("User profile not found or access denied. This might be expected if the profile hasn't been created yet or RLS rules prevent access. User ID:", session.user.id);
                 setFullName(''); // Default to empty if profile not found/accessible
            } else {
                throw error; // Re-throw other errors
            }
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
      <Card className="shadow-lg max-w-2xl mx-auto">
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
            <Info className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" /> Important Note on Roles & RLS
            </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-600 dark:text-blue-300/90 text-sm space-y-1">
           <p>
            This form allows you to update your display name. Your 'role' (e.g., admin) is managed separately and cannot be changed here.
           </p>
           <p>
            For Supabase, ensure your RLS policy on the <code>profiles</code> table allows users to update their own <code>full_name</code> and <code>updated_at</code> columns, but restricts changes to sensitive columns like <code>role</code>.
            An appropriate RLS policy for updating one's own profile (excluding the role field by users) might look like this:
           </p>
            <pre className="mt-1 p-2 bg-stone-100 dark:bg-stone-800 rounded text-xs overflow-x-auto">
{`-- Assumes you have a 'profiles' table with 'id' (uuid, PK, FK to auth.users), 'full_name' (text), 'role' (text)

-- Allow users to update their own full_name and ensure updated_at is set
CREATE POLICY "Allow users to update their own full_name"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Ensure the 'role' column is not being changed by this policy
  (current_setting('request.jwt.claims', true)::jsonb->>'role' IS NULL OR (current_setting('request.jwt.claims', true)::jsonb->>'role')::text = (SELECT role FROM public.profiles WHERE id = auth.uid()))
  -- The above is a complex way to say "don't let users change their own role".
  -- A simpler approach for this form is to ensure your backend logic/Server Action only updates specific fields.
  -- The Server Action 'updateUserProfile' only updates 'full_name' and 'updated_at', so it's safer.
  -- A more direct RLS to allow update of only specific columns is not straightforward in Supabase's SQL RLS.
  -- A better approach is to rely on the Server Action to only update allowed fields.
  -- However, a basic update policy:
  true -- This should be refined. The server action is the primary guard here.
);

-- Simpler policy if your Server Action is trusted to only update specific fields:
CREATE POLICY "Allow users to update their own profile via trusted actions"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
`}
            </pre>
            <p className="text-xs mt-1">
              <strong>Important:</strong> The <code>updateUserProfile</code> server action in <code>src/app/admin-actions.ts</code> is designed to only update <code>full_name</code> and <code>updated_at</code>.
              Your RLS policies should complement this by ensuring users can indeed update their own profile record (<code>USING (auth.uid() = id)</code>) while more restrictive policies or server-side logic would prevent them from elevating their privileges by modifying the <code>role</code> column.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
