
'use server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client'; // Import Supabase client
import type { CourseLink } from '@/lib/affiliateLinks';
import type { AuthError, PostgrestError } from '@supabase/supabase-js';

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
    const { data, error } = await supabase
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
    // Check if title already exists
    const { data: existingLink, error: selectError } = await supabase
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

    const { data: newLink, error: insertError } = await supabase
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
  
  const { affiliateUrl, displayText } = validatedFields.data; // Title is not updated here
  const updatedData: Partial<CourseLink> = { affiliateUrl, displayText: displayText || null };


  try {
    const { data: updatedLink, error } = await supabase
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
    const { error } = await supabase
      .from('affiliateLinks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, message: 'Affiliate link deleted successfully.' };
  } catch (error: any) {
    console.error("Error deleting affiliate link from Supabase:", error);
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
  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
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
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        full_name: fullName,
        updated_at: new Date().toISOString(), // Explicitly set updated_at
      })
      .eq('id', user.id);

    if (updateError) {
      console.error("Error updating profile in Supabase:", updateError);
      let message = updateError.message || 'Failed to update profile.';
      // Check for specific RLS violation error (code 42501 for permission denied)
      if (updateError.code === '42501') {
          message = 'Permission denied. Check RLS policies on the profiles table for update operations.';
      } else if (updateError.code === '23503') { // foreign_key_violation (should not happen if id is correct)
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


    