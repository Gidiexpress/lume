
'use server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client'; // Import Supabase client
import type { CourseLink } from '@/lib/affiliateLinks';

// Zod Schema for validating affiliate links remains the same
const AffiliateLinkSchema = z.object({
  id: z.string().optional(), // Supabase uses string UUIDs for IDs by default if auto-generated
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
      .from('affiliateLinks') // Ensure this table name matches your Supabase table
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
export async function addAffiliateLink(formData: FormData): Promise<AdminActionState> {
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

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116: "Searched for one row, but found 0" (expected if not found)
        throw selectError;
    }
    if (existingLink) {
      return { success: false, message: `An affiliate link with the title "${title}" already exists.` };
    }

    const { data: newLink, error: insertError } = await supabase
      .from('affiliateLinks')
      .insert([{ title, affiliateUrl, displayText: displayText || null }]) // Ensure optional fields are null if empty
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
export async function updateAffiliateLink(formData: FormData): Promise<AdminActionState> {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: "Link ID is missing." };
  }

  const validatedFields = AffiliateLinkSchema.safeParse({
    id: id, // id is validated but not directly updatable here
    title: formData.get('title'), // Title typically shouldn't change if it's a key
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
  
  // For Supabase, 'id' is the primary key. 'title' may or may not be unique depending on your table constraints.
  // The form currently disables editing title. If title changes were allowed, you'd need to handle potential uniqueness conflicts.
  const { affiliateUrl, displayText } = validatedFields.data;
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
