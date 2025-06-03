
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

export interface UserAnalyticsData {
  totalUsers: number;
  newUsersThisWeek: number;
  fieldsOfStudy: { name: string; value: number }[];
  premiumVsFree: { premium: number; free: number };
  topRecommendedPaths: { name: string; count: number }[];
}

export interface ReportInsightsData {
  totalReportsGenerated: number;
  premiumReportsGenerated: number; // Changed from downloaded to generated for clarity
  averageSkillReadiness: number;
  topGeneratedByField: { field: string; count: number }[]; // Changed for clarity
}

export interface AnalyticsActionState {
  message: string | null;
  success: boolean;
  data?: UserAnalyticsData | ReportInsightsData | null;
}


// Fetch all affiliate links from Supabase
export async function getAffiliateLinks(): Promise<AdminActionState> {
  const supabase = createServerActionClient({ cookies });
  try {
    // console.log("[AdminAction] Attempting to fetch affiliate links from Supabase...");
    const { data, error } = await supabase
      .from('affiliateLinks')
      .select('id, title, "affiliateUrl", "displayText", created_at') 
      .order('title', { ascending: true });

    if (error) {
      console.error("[AdminAction] Supabase error in getAffiliateLinks:", JSON.stringify(error, null, 2));
      throw error;
    }
    // console.log("[AdminAction] Affiliate links fetched successfully from Supabase.");
    return { success: true, message: 'Affiliate links fetched successfully.', data: data as CourseLink[] };
  } catch (error: any) {
    // console.error("[AdminAction] Catch block in getAffiliateLinks. Error:", JSON.stringify(error, null, 2));
    
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
      .insert([{ title, affiliateUrl: affiliateUrl, displayText: displayText || null }]) 
      .select('id, title, "affiliateUrl", "displayText", created_at')
      .single();

    if (insertError) {
        console.error('[AdminAction] Error inserting new link:', JSON.stringify(insertError, null, 2));
        throw insertError;
    }
    return { success: true, message: 'Affiliate link added successfully.', data: newLink as CourseLink };
  } catch (error: any) {
    // console.error("[AdminAction] Catch block in addAffiliateLink. Error:", JSON.stringify(error, null, 2));
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
    // console.error("[AdminAction] Catch block in updateAffiliateLink. Error:", JSON.stringify(error, null, 2));
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
    // console.error("[AdminAction] Catch block in deleteAffiliateLink. Error:", JSON.stringify(error, null, 2));
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
      console.error("Error updating user profile:", error);
      return { success: false, message: error.message || 'Failed to update profile.' };
    }
  }


// Server action to get user analytics data
export async function getUserAnalyticsData(): Promise<AnalyticsActionState> {
  const supabase = createServerActionClient({ cookies });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: 'Authentication required to fetch analytics.' };
  }
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profileError || !profile || profile.role !== 'admin') {
    return { success: false, message: 'Admin privileges required for analytics.' };
  }

  const analyticsData: UserAnalyticsData = {
    totalUsers: 0,
    newUsersThisWeek: 0,
    fieldsOfStudy: [],
    premiumVsFree: { premium: 0, free: 0 },
    topRecommendedPaths: [],
  };

  try {
    // Total Users
    const { count: totalUsersCount, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (usersError) console.error('Error fetching total users:', JSON.stringify(usersError, null, 2));
    else analyticsData.totalUsers = totalUsersCount || 0;

    // New Users This Week
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newUsersCount, error: newUsersError } = await supabase
      .from('auth.users') // Using auth.users for creation timestamp
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);
    if (newUsersError) console.error('Error fetching new users:', JSON.stringify(newUsersError, null, 2));
    else analyticsData.newUsersThisWeek = newUsersCount || 0;

    // Fields of Study (Top 5)
    // Note: Direct GROUP BY and COUNT is complex with Supabase JS client.
    // This is a simplified version. For true aggregation, an RPC function is better.
    const { data: fieldsLogs, error: fieldsError } = await supabase
      .from('user_activity_logs')
      .select('field_of_study')
      .neq('field_of_study', null) // Ensure field_of_study is not null
      .limit(500); // Fetch a reasonable number of recent logs to process
    
    if (fieldsError) console.error('Error fetching fields of study logs:', JSON.stringify(fieldsError, null, 2));
    else if (fieldsLogs) {
      const fieldCounts: Record<string, number> = {};
      fieldsLogs.forEach(log => {
        if (log.field_of_study) {
          fieldCounts[log.field_of_study] = (fieldCounts[log.field_of_study] || 0) + 1;
        }
      });
      analyticsData.fieldsOfStudy = Object.entries(fieldCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    }
    
    // Premium vs Free Reports Generated
    const { data: reportTypeLogs, error: reportTypesError } = await supabase
        .from('user_activity_logs')
        .select('activity_type');
    
    if(reportTypesError) console.error('Error fetching report type logs:', JSON.stringify(reportTypesError, null, 2));
    else if (reportTypeLogs) {
        reportTypeLogs.forEach(log => {
            if (log.activity_type === 'PREMIUM_REPORT_GENERATED') {
                analyticsData.premiumVsFree.premium++;
            } else if (log.activity_type === 'FREE_REPORT_GENERATED') {
                analyticsData.premiumVsFree.free++;
            }
        });
    }

    // Top Recommended Paths (Top 5)
    // This is very complex with JSONB arrays. Simplification: count occurrences of the *first* path.
    // An RPC function would be much better here for unnesting and counting.
    const { data: pathLogs, error: pathError } = await supabase
      .from('user_activity_logs')
      .select('generated_path_names')
      .neq('generated_path_names', null)
      .limit(500);

    if (pathError) console.error('Error fetching path logs:', JSON.stringify(pathError, null, 2));
    else if (pathLogs) {
        const pathCounts: Record<string, number> = {};
        pathLogs.forEach(log => {
            if (log.generated_path_names && Array.isArray(log.generated_path_names) && log.generated_path_names.length > 0) {
                const firstPath = log.generated_path_names[0];
                if (typeof firstPath === 'string') {
                     pathCounts[firstPath] = (pathCounts[firstPath] || 0) + 1;
                }
            }
        });
        analyticsData.topRecommendedPaths = Object.entries(pathCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a,b) => b.count - a.count)
            .slice(0,5);
    }


    return { success: true, message: 'User analytics fetched successfully.', data: analyticsData };
  } catch (error: any) {
    console.error('Error processing user analytics data:', JSON.stringify(error, null, 2));
    return { success: false, message: `Failed to fetch user analytics: ${error.message}`, data: analyticsData }; // Return partial/default on error
  }
}

// Server action to get report insights data
export async function getReportInsightsData(): Promise<AnalyticsActionState> {
    const supabase = createServerActionClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, message: 'Authentication required to fetch report insights.' };
    }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || !profile || profile.role !== 'admin') {
        return { success: false, message: 'Admin privileges required for report insights.' };
    }

    const insightsData: ReportInsightsData = {
        totalReportsGenerated: 0,
        premiumReportsGenerated: 0,
        averageSkillReadiness: 0,
        topGeneratedByField: [],
    };

    try {
        // Total Reports Generated (Free + Premium)
        const { count: totalCount, error: totalError } = await supabase
            .from('user_activity_logs')
            .select('*', { count: 'exact', head: true })
            .in('activity_type', ['FREE_REPORT_GENERATED', 'PREMIUM_REPORT_GENERATED']);
        if (totalError) console.error('Error fetching total reports count:', JSON.stringify(totalError, null, 2));
        else insightsData.totalReportsGenerated = totalCount || 0;

        // Premium Reports Generated
        const { count: premiumCount, error: premiumError } = await supabase
            .from('user_activity_logs')
            .select('*', { count: 'exact', head: true })
            .eq('activity_type', 'PREMIUM_REPORT_GENERATED');
        if (premiumError) console.error('Error fetching premium reports count:', JSON.stringify(premiumError, null, 2));
        else insightsData.premiumReportsGenerated = premiumCount || 0;

        // Average Skill Readiness Score for Premium Reports
        const { data: readinessScores, error: readinessError } = await supabase
            .from('user_activity_logs')
            .select('skill_readiness_score')
            .eq('activity_type', 'PREMIUM_REPORT_GENERATED')
            .neq('skill_readiness_score', null);

        if (readinessError) console.error('Error fetching readiness scores:', JSON.stringify(readinessError, null, 2));
        else if (readinessScores && readinessScores.length > 0) {
            const sum = readinessScores.reduce((acc, curr) => acc + (curr.skill_readiness_score || 0), 0);
            insightsData.averageSkillReadiness = parseFloat((sum / readinessScores.length).toFixed(1));
        }
        
        // Top Reports Generated by Field of Study (Top 5)
        // Similar to user analytics, direct GROUP BY is hard. Using client-side aggregation from fetched logs.
        // An RPC is highly recommended for this in production.
        const { data: fieldLogs, error: fieldLogsError } = await supabase
            .from('user_activity_logs')
            .select('field_of_study')
            .in('activity_type', ['FREE_REPORT_GENERATED', 'PREMIUM_REPORT_GENERATED'])
            .neq('field_of_study', null)
            .limit(1000); // Fetch a good sample or all if feasible

        if (fieldLogsError) console.error('Error fetching field logs for report insights:', JSON.stringify(fieldLogsError, null, 2));
        else if (fieldLogs) {
            const fieldCounts: Record<string, number> = {};
            fieldLogs.forEach(log => {
                 if (log.field_of_study) {
                    fieldCounts[log.field_of_study] = (fieldCounts[log.field_of_study] || 0) + 1;
                }
            });
            insightsData.topGeneratedByField = Object.entries(fieldCounts)
                .map(([field, count]) => ({ field, count }))
                .sort((a,b) => b.count - a.count)
                .slice(0,5);
        }

        return { success: true, message: 'Report insights fetched successfully.', data: insightsData };

    } catch (error: any) {
        console.error('Error processing report insights data:', JSON.stringify(error, null, 2));
        return { success: false, message: `Failed to fetch report insights: ${error.message}`, data: insightsData };
    }
}
