
import { supabase } from '@/lib/supabase/client'; // Import Supabase client

export interface CourseLink {
  id?: string; // Supabase typically uses string UUIDs for 'id' if auto-generated
  title: string; 
  affiliateUrl: string; // Ensure this matches your Supabase column name (e.g., affiliate_url)
  displayText?: string; // Ensure this matches your Supabase column name (e.g., display_text)
}

let COURSE_AFFILIATE_LINKS_CACHE: CourseLink[] = [];
let linksFetchedSuccessfully = true;
let lastFetchTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Fetches links from Supabase and populates the cache.
// Ensures it only fetches periodically.
export async function fetchAndCacheAffiliateLinks(): Promise<void> {
  const now = Date.now();
  if (linksFetchedSuccessfully && (now - lastFetchTimestamp < CACHE_DURATION)) {
    // console.log("Using cached affiliate links (Supabase).");
    return;
  }
  try {
    // console.log("Fetching affiliate links from Supabase...");
    const { data, error } = await supabase
      .from('affiliatelinks') // Ensure this table name matches your Supabase table
      .select('id, title, affiliateUrl, displayText'); // Specify columns

    if (error) {
      throw error;
    }
    
    COURSE_AFFILIATE_LINKS_CACHE = data as CourseLink[];
    linksFetchedSuccessfully = true;
    lastFetchTimestamp = now;
    // console.log("Affiliate links fetched from Supabase and cached:", COURSE_AFFILIATE_LINKS_CACHE);
  } catch (error) {
    console.error("Error fetching and caching affiliate links from Supabase:", error);
    linksFetchedSuccessfully = false; // Allow refetch on next attempt if this one failed
  }
}

// Synchronously finds an affiliate link in the cache.
// Assumes fetchAndCacheAffiliateLinks has been called (e.g., in a useEffect).
export function findAffiliateLinkInCache(courseTitle: string): CourseLink | undefined {
  if (!courseTitle) {
    return undefined;
  }
  // It's okay if linksFetchedSuccessfully is false here; it means the cache might be empty or stale,
  // and find will just return undefined, which is handled by the caller.
  
  const normalizedCourseTitle = courseTitle.toLowerCase().trim();
  const foundLink = COURSE_AFFILIATE_LINKS_CACHE.find(
    link => link.title.toLowerCase().trim() === normalizedCourseTitle
  );
  return foundLink;
}
