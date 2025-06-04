'use server';
import { z } from 'zod';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { CourseLink } from '@/lib/affiliateLinks';
import type { PostgrestError, User } from '@supabase/supabase-js';

// Zod Schema for validating affiliate links
const AffiliateLinkSchema = z.object({
  id: z.string().optional(), // id is present for update, not for add
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

export interface UserProfileState {
  message: string | null;
  success: boolean;
  issues?: string[];
}


// Fetch all affiliate links from Supabase
export async function getAffiliateLinks(): Promise<AdminActionState> {
  const supabase = createServerActionClient({ cookies });
  try {
    console.log("[AdminAction] Attempting to fetch affiliate links from Supabase...");
    const { data, error } = await supabase
      .from('affiliateLinks')
      .select('id, title, "affiliateUrl", "displayText", created_at') // Use quoted column names if they were created quoted
      .order('title', { ascending: true });

    if (error) {
      console.error("[AdminAction] Supabase error in getAffiliateLinks:", JSON.stringify(error, null, 2));
      throw error;
    }
    console.log("[AdminAction] Affiliate links fetched successfully from Supabase.");
    return { success: true, message: 'Affiliate links fetched successfully.', data: data as CourseLink[] };
  } catch (error: any) {
    console.error("[AdminAction] Catch block in getAffiliateLinks. Error:", JSON.stringify(error, null, 2));
    
    let clientErrorMessage = 'Failed to fetch affiliate links.';
    if (error.message) {
      clientErrorMessage = error.message;
    }
    if (error.code) {
        clientErrorMessage += ` (Code: ${error.code})`;
    }
     if (error.details) {
        clientErrorMessage += ` Details: ${error.details}`;
    }
    if (error.hint) {
        clientErrorMessage += ` Hint: ${error.hint}`;
    }

    return { success: false, message: clientErrorMessage, data: [] };
  }
}

// Add a new affiliate link to Supabase
export async function addAffiliateLink(prevState: AdminActionState | undefined, formData: FormData): Promise<AdminActionState> {
  const supabase = createServerActionClient({ cookies });

  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('[AdminAction] Supabase auth.getUser() error in addAffiliateLink:', JSON.stringify(authError, null, 2));
    return { success: false, message: `Authentication error: ${authError.message}. Please try logging in again.` };
  }
  if (!userData?.user) {
    console.error('[AdminAction] No user session found in addAffiliateLink server action. AuthError (if any):', JSON.stringify(authError, null, 2));
    return { success: false, message: 'Authentication error: Auth session missing!. Please try logging in again.' };
  }
  const user = userData.user;

  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profileError) {
    console.error('[AdminAction] Error fetching profile in addAffiliateLink:', JSON.stringify(profileError, null, 2));
    return { success: false, message: `Authorization failed. Could not retrieve profile: ${profileError.message}` };
  }
  if (!profile || profile.role !== 'admin') {
    return { success: false, message: 'Authorization failed. Admin privileges required.' };
  }


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
    const { data: existingLink, error: selectError } = await supabase
      .from('affiliateLinks')
      .select('title')
      .eq('title', title)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') { 
        console.error('[AdminAction] Error checking existing link:', JSON.stringify(selectError, null, 2));
        throw selectError;
    }
    if (existingLink) {
      return { success: false, message: `An affiliate link with the title "${title}" already exists.` };
    }

    const { data: newLink, error: insertError } = await supabase
      .from('affiliateLinks')
      .insert([{ title, affiliateUrl: affiliateUrl, displayText: displayText || null }]) // Ensure mapping matches DB column names
      .select('id, title, "affiliateUrl", "displayText", created_at')
      .single();

    if (insertError) {
        console.error('[AdminAction] Error inserting new link:', JSON.stringify(insertError, null, 2));
        throw insertError;
    }
    return { success: true, message: 'Affiliate link added successfully.', data: newLink as CourseLink };
  } catch (error: any) {
    console.error("[AdminAction] Catch block in addAffiliateLink. Error:", JSON.stringify(error, null, 2));
    if ((error as PostgrestError)?.message?.includes('violates row-level security policy')) {
        return { success: false, message: `Failed to add link: The operation violates the database security policy. Ensure your admin account has permissions to add to 'affiliateLinks'. (Error: ${error.message})` };
    }
    return { success: false, message: error.message || 'Failed to add affiliate link.' };
  }
}

// Update an existing affiliate link in Supabase
export async function updateAffiliateLink(prevState: AdminActionState | undefined, formData: FormData): Promise<AdminActionState> {
  const supabase = createServerActionClient({ cookies });

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[AdminAction] Supabase auth.getUser() error in updateAffiliateLink:', JSON.stringify(authError, null, 2));
    return { success: false, message: `Authentication error: ${authError.message}. Please try logging in again.` };
  }
  if (!userData?.user) {
    console.error('[AdminAction] No user session found in updateAffiliateLink server action. AuthError (if any):', JSON.stringify(authError, null, 2));
    return { success: false, message: 'Authentication error: Auth session missing!. Please try logging in again.' };
  }
  const user = userData.user;

  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profileError) {
    console.error('[AdminAction] Error fetching profile in updateAffiliateLink:', JSON.stringify(profileError, null, 2));
    return { success: false, message: `Authorization failed. Could not retrieve profile: ${profileError.message}` };
  }
  if (!profile || profile.role !== 'admin') {
    return { success: false, message: 'Authorization failed. Admin privileges required.' };
  }


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

  // Title cannot be updated via this form to maintain uniqueness and simplicity.
  // Only affiliateUrl and displayText are updated.
  const { affiliateUrl, displayText } = validatedFields.data;
  const updatedData: { "affiliateUrl": string; "displayText": string | null } = { 
    "affiliateUrl": affiliateUrl, 
    "displayText": displayText || null 
  };


  try {
    const { data: updatedLink, error } = await supabase
      .from('affiliateLinks')
      .update(updatedData)
      .eq('id', id)
      .select('id, title, "affiliateUrl", "displayText", created_at')
      .single();

    if (error) {
        console.error('[AdminAction] Error updating link:', JSON.stringify(error, null, 2));
        throw error;
    }
    if (!updatedLink) return { success: false, message: 'Failed to find link to update or update failed.' };

    return { success: true, message: 'Affiliate link updated successfully.', data: updatedLink as CourseLink };
  } catch (error: any) {
    console.error("[AdminAction] Catch block in updateAffiliateLink. Error:", JSON.stringify(error, null, 2));
     if ((error as PostgrestError)?.message?.includes('violates row-level security policy')) {
        return { success: false, message: `Failed to update link: The operation violates the database security policy. Ensure your admin account has permissions. (Error: ${error.message})` };
    }
    return { success: false, message: error.message || 'Failed to update affiliate link.' };
  }
}

// Delete an affiliate link from Supabase
export async function deleteAffiliateLink(linkId: string): Promise<Omit<AdminActionState, 'data'>> {
  const supabase = createServerActionClient({ cookies });

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[AdminAction] Supabase auth.getUser() error in deleteAffiliateLink:', JSON.stringify(authError, null, 2));
    return { success: false, message: `Authentication error: ${authError.message}. Please try logging in again.` };
  }
  if (!userData?.user) {
    console.error('[AdminAction] No user session found in deleteAffiliateLink server action. AuthError (if any):', JSON.stringify(authError, null, 2));
    return { success: false, message: 'Authentication error: Auth session missing!. Please try logging in again.' };
  }
  const user = userData.user;

  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profileError) {
    console.error('[AdminAction] Error fetching profile in deleteAffiliateLink:', JSON.stringify(profileError, null, 2));
    return { success: false, message: `Authorization failed. Could not retrieve profile: ${profileError.message}` };
  }
  if (!profile || profile.role !== 'admin') {
    return { success: false, message: 'Authorization failed. Admin privileges required.' };
  }


  if (!linkId) {
    return { success: false, message: "Link ID is missing." };
  }
  try {
    const { error } = await supabase
      .from('affiliateLinks')
      .delete()
      .eq('id', linkId);

    if (error) {
        console.error('[AdminAction] Error deleting link:', JSON.stringify(error, null, 2));
        throw error;
    }
    return { success: true, message: 'Affiliate link deleted successfully.' };
  } catch (error: any) {
    console.error("[AdminAction] Catch block in deleteAffiliateLink. Error:", JSON.stringify(error, null, 2));
    if ((error as PostgrestError)?.message?.includes('violates row-level security policy')) {
        return { success: false, message: `Failed to delete link: The operation violates the database security policy. Ensure your admin account has permissions. (Error: ${error.message})` };
    }
    return { success: false, message: error.message || 'Failed to delete affiliate link.' };
  }
}

// Update user profile (e.g., full_name)
const UserProfileSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
});

export async function updateUserProfile(prevState: UserProfileState | undefined, formData: FormData): Promise<UserProfileState> {
  const supabase = createServerActionClient({ cookies });
  
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[AdminAction] Supabase auth.getUser() error in updateUserProfile:', JSON.stringify(authError, null, 2));
    return { success: false, message: `Authentication error: ${authError.message}. Please try logging in again.` };
  }
  if (!userData?.user) {
    console.error('[AdminAction] No user session found in updateUserProfile server action. AuthError (if any):', JSON.stringify(authError, null, 2));
    return { success: false, message: "Authentication error: Auth session missing!. Please log in again." };
  }
  const user = userData.user;


  const validatedFields = UserProfileSchema.safeParse({
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
  try {
    // Note: RLS policies on 'profiles' table must allow the user to update their own 'full_name' and 'updated_at'.
    // It should ideally prevent them from updating their 'role'.
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
        console.error('[AdminAction] Error updating profile in Supabase:', JSON.stringify(error, null, 2));
        throw error;
    }
    return { success: true, message: 'Profile updated successfully.' };
  } catch (error: any) {
    console.error("[AdminAction] Catch block in updateUserProfile. Error:", JSON.stringify(error, null, 2));
    return { success: false, message: error.message || 'Failed to update profile.' };
  }
}
    
