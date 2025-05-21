
'use server';
import { z } from 'zod';
import { supabase as supabaseClient } from '@/lib/supabase/client'; // Standard client for RLS-protected actions if needed
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { CourseLink } from '@/lib/affiliateLinks';
import type { PostgrestError } from '@supabase/supabase-js';

// Zod Schema for validating affiliate links
const AffiliateLinkSchema = z.object({
  id: z.string().optional(), 
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  affiliateUrl: z.string().url({ message: "Please enter a valid URL." }),
  displayText: z.string().optional(),
});

export interface AdminActionState {
  message: string | null;
  success: boolean;
  issues?: string[];
  data?: CourseLink[] | CourseLink | null;
}

// Fetch all affiliate links from Supabase
export async function getAffiliateLinks(): Promise<AdminActionState> {
  try {
    // For public reads or RLS-protected reads not requiring specific user context for the query itself,
    // the standard client can be okay, assuming RLS policies are set up correctly.
    const { data, error } = await supabaseClient
      .from('affiliateLinks') 
      .select('*')
      .order('title', { ascending: true });

    if (error) throw error;
    return { success: true, message: 'Affiliate links fetched successfully.', data: data as CourseLink[] };
  } catch (error: any) {
    console.error("Error fetching affiliate links from Supabase:", error);
    return { success: false, message: error.message || 'Failed to fetch affiliate links.', data: [] };
  }
}

// Add a new affiliate link to Supabase
export async function addAffiliateLink(prevState: AdminActionState | undefined, formData: FormData): Promise<AdminActionState> {
  const validatedFields = AffiliateLinkSchema.safeParse({
    title: formData.get('title'),
    affiliateUrl: formData.get('affiliateUrl'),
    displayText: formData.get('displayText') || undefined,
  });

  if (!validatedFields.success) {
    return {
      message: "Invalid form data: " + validatedFields.error.issues.map(i => i.message).join(', '),
      issues: validatedFields.error.issues.map(i => i.message),
      success: false,
    };
  }

  const { title, affiliateUrl, displayText } = validatedFields.data;

  try {
    // Write operations like insert/update/delete should ideally be secured by RLS
    // ensuring only authorized users (admins) can perform them.
    // The client used (standard or serverActionClient) matters less for the DB operation itself
    // if RLS is correctly configured for the authenticated user's role.
    const { data: existingLink, error: selectError } = await supabaseClient
      .from('affiliateLinks')
      .select('title')
      .eq('title', title)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') { 
        throw selectError;
    }
    if (existingLink) {
      return { success: false, message: `An affiliate link with the title "${title}" already exists.` };
    }

    const { data: newLink, error: insertError } = await supabaseClient
      .from('affiliateLinks')
      .insert([{ title, affiliateUrl, displayText: displayText || null }]) 
      .select()
      .single();

    if (insertError) throw insertError;
    return { success: true, message: 'Affiliate link added successfully.', data: newLink as CourseLink };
  } catch (error: any) {
    console.error("Error adding affiliate link to Supabase:", error);
    return { success: false, message: error.message || 'Failed to add affiliate link.' };
  }
}

// Update an existing affiliate link in Supabase
export async function updateAffiliateLink(prevState: AdminActionState | undefined, formData: FormData): Promise<AdminActionState> {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: "Link ID is missing." };
  }

  const validatedFields = AffiliateLinkSchema.safeParse({
    id: id, 
    title: formData.get('title'), 
    affiliateUrl: formData.get('affiliateUrl'),
    displayText: formData.get('displayText') || undefined,
  });

  if (!validatedFields.success) {
    return {
      message: "Invalid form data: " + validatedFields.error.issues.map(i => i.message).join(', '),
      issues: validatedFields.error.issues.map(i => i.message),
      success: false,
    };
  }
  
  const { affiliateUrl, displayText } = validatedFields.data; 
  const updatedData: Partial<CourseLink> = { affiliateUrl, displayText: displayText || null };


  try {
    const { data: updatedLink, error } = await supabaseClient
      .from('affiliateLinks')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!updatedLink) return { success: false, message: 'Failed to find link to update or update failed.' };
    
    return { success: true, message: 'Affiliate link updated successfully.', data: updatedLink as CourseLink };
  } catch (error: any) {
    console.error("Error updating affiliate link in Supabase:", error);
    return { success: false, message: error.message || 'Failed to update affiliate link.' };
  }
}

// Delete an affiliate link from Supabase
export async function deleteAffiliateLink(id: string): Promise<AdminActionState> {
  if (!id) {
    return { success: false, message: "Link ID is missing." };
  }
  try {
    const { error } = await supabaseClient
      .from('affiliateLinks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, message: 'Affiliate link deleted successfully.' };
  } catch (error: any) {
    console.error("Error deleting affiliate link in Supabase:", error);
    return { success: false, message: error.message || 'Failed to delete affiliate link.' };
  }
}


// For User Profile Update
const UpdateProfileSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }).max(100, {message: "Full name too long."}),
});

export interface UserProfileState {
  message: string | null;
  success: boolean;
  issues?: string[];
}

export async function updateUserProfile(prevState: UserProfileState | undefined, formData: FormData): Promise<UserProfileState> {
  const supabase = createServerActionClient({ cookies }); // Create server-side client

  // 1. Get authenticated user using the server-side client
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Auth error in updateUserProfile:', authError);
    return { success: false, message: 'Authentication error: Could not get user.' };
  }

  // 2. Validate form data
  const validatedFields = UpdateProfileSchema.safeParse({
    fullName: formData.get('fullName'),
  });

  if (!validatedFields.success) {
    return {
      message: "Invalid form data: " + validatedFields.error.issues.map(i => i.message).join(', '),
      issues: validatedFields.error.issues.map(i => i.message),
      success: false,
    };
  }

  const { fullName } = validatedFields.data;

  // 3. Update profile in Supabase 'profiles' table
  try {
    // For this DB operation, RLS on 'profiles' table will enforce permissions based on the authenticated user.
    // So using the serverActionClient here is fine, or even the standard client if RLS is robust.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        full_name: fullName,
        updated_at: new Date().toISOString(), 
      })
      .eq('id', user.id);

    if (updateError) {
      console.error("Error updating profile in Supabase:", updateError);
      let message = updateError.message || 'Failed to update profile.';
      if (updateError.code === '42501') {
          message = 'Permission denied. Check RLS policies on the profiles table for update operations.';
      } else if (updateError.code === '23503') { 
          message = 'Error: User ID not found for profile update.';
      }
      return { success: false, message };
    }

    return { success: true, message: 'Profile updated successfully!' };
  } catch (error: any) {
    console.error("Unexpected error updating profile:", error);
    return { success: false, message: 'An unexpected error occurred while updating profile.' };
  }
}
