
import { db } from '@/lib/firebase/config'; 
import { collection, getDocs } from 'firebase/firestore';

export interface CourseLink {
  id?: string; 
  title: string; 
  affiliateUrl: string;
  displayText?: string; 
}

let COURSE_AFFILIATE_LINKS_CACHE: CourseLink[] = [];
let linksFetchedSuccessfully = false;

// Fetches links from Firestore and populates the cache.
// Ensures it only fetches once per successful attempt.
export async function fetchAndCacheAffiliateLinks(): Promise<void> {
  if (linksFetchedSuccessfully) {
    // console.log("Using cached affiliate links.");
    return;
  }
  try {
    // console.log("Fetching affiliate links from Firestore...");
    const affiliateLinksCollection = collection(db, 'affiliateLinks');
    const snapshot = await getDocs(affiliateLinksCollection);
    COURSE_AFFILIATE_LINKS_CACHE = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseLink));
    linksFetchedSuccessfully = true;
    // console.log("Affiliate links fetched and cached:", COURSE_AFFILIATE_LINKS_CACHE);
  } catch (error) {
    console.error("Error fetching and caching affiliate links from Firestore:", error);
    // If fetching fails, linksFetchedSuccessfully remains false, and the cache might be empty or stale.
    // Allow subsequent attempts to fetch if this one failed.
    linksFetchedSuccessfully = false; 
  }
}

// Synchronously finds an affiliate link in the cache.
// Assumes fetchAndCacheAffiliateLinks has been called.
export function findAffiliateLinkInCache(courseTitle: string): CourseLink | undefined {
  if (!courseTitle || !linksFetchedSuccessfully) {
    // If links haven't been fetched successfully or title is invalid, return undefined.
    // console.log("Cannot find in cache: Links not fetched or invalid title - ", {courseTitle, linksFetchedSuccessfully});
    return undefined;
  }
  
  const normalizedCourseTitle = courseTitle.toLowerCase().trim();
  const foundLink = COURSE_AFFILIATE_LINKS_CACHE.find(
    link => link.title.toLowerCase().trim() === normalizedCourseTitle
  );
  // if (foundLink) console.log("Found link in cache for title:", courseTitle, foundLink);
  // else console.log("No link found in cache for title:", courseTitle);
  return foundLink;
}

// This export might not be needed externally if components use the functions above.
// export { COURSE_AFFILIATE_LINKS_CACHE as MANAGED_AFFILIATE_LINKS_CACHE };
