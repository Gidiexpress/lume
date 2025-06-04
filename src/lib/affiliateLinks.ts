
import { supabase } from '@/lib/supabase/client'; // Import Supabase client

export interface CourseLink {
  id?: string; 
  title: string; 
  affiliateUrl: string; 
  displayText?: string; 
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
    // Ensure table name 'affiliatelinks' (all lowercase) matches your actual Supabase table name.
    // If your table was created with quotes like CREATE TABLE "affiliateLinks", then use 'affiliateLinks'.
    const { data, error: supabaseError } = await supabase
      .from('affiliatelinks') 
      .select('id, title, "affiliateUrl", "displayText"'); // Column names "affiliateUrl" and "displayText" are quoted to preserve case.

    if (supabaseError) {
      console.error("Supabase error occurred. Raw error object:", supabaseError);
      // Attempt to log individual known properties safely
      const message = supabaseError.message || "No message property";
      const code = supabaseError.code || "No code property";
      const details = supabaseError.details || "No details property";
      const hint = supabaseError.hint || "No hint property";
      console.error(`Supabase Error Properties: Message: "${message}", Code: "${code}", Details: "${details}", Hint: "${hint}"`);
      
      // Try stringifying the error if the above isn't enough
      try {
        console.error("Full stringified Supabase error:", JSON.stringify(supabaseError, null, 2));
      } catch (e) {
        console.error("Could not stringify Supabase error object.");
      }
      
      // Throw a new standard Error for the catch block below
      throw new Error(`Supabase fetch error: ${message} (Code: ${code})`);
    }
    
    COURSE_AFFILIATE_LINKS_CACHE = data as CourseLink[];
    linksFetchedSuccessfully = true;
    lastFetchTimestamp = now;
    // console.log("Affiliate links fetched from Supabase and cached:", COURSE_AFFILIATE_LINKS_CACHE);
  } catch (e: any) {
    let detailedMessage = "An unknown error occurred while fetching/caching affiliate links.";
    // Try to extract a meaningful message from the error object
    if (e instanceof Error && e.message) {
        detailedMessage = e.message;
    } else if (typeof e === 'object' && e !== null && (e as any).message) {
        detailedMessage = (e as any).message;
    } else if (typeof e === 'string' && e) {
        detailedMessage = e;
    }
    
    console.error("Error in fetchAndCacheAffiliateLinks (outer catch):", detailedMessage);
    // Log the full error object if it's not a standard Error and wasn't already logged well
    if (!(e instanceof Error) && typeof e === 'object' && e !== null) {
        try {
            console.error("Full caught object structure in outer catch (if not Error instance):", JSON.stringify(e, null, 2));
        } catch (stringifyError) {
            console.error("Full caught object in outer catch (could not stringify):", e);
        }
    }
    
    linksFetchedSuccessfully = false; // Allow refetch on next attempt if this one failed
  }
}

// Synchronously finds an affiliate link in the cache.
// Assumes fetchAndCacheAffiliateLinks has been called (e.g., in a useEffect).
export function findAffiliateLinkInCache(courseTitle: string): CourseLink | undefined {
  if (!courseTitle) {
    return undefined;
  }
  
  const normalizedCourseTitle = courseTitle.toLowerCase().trim();
  const foundLink = COURSE_AFFILIATE_LINKS_CACHE.find(
    link => link.title.toLowerCase().trim() === normalizedCourseTitle
  );
  return foundLink;
}

