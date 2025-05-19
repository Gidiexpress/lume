
'use server'; // Keep this if it was intended, though for client-side cache, it might not be strictly necessary for all functions.

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
    return;
  }
  try {
    const affiliateLinksCollection = collection(db, 'affiliateLinks');
    const snapshot = await getDocs(affiliateLinksCollection);
    COURSE_AFFILIATE_LINKS_CACHE = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseLink));
    linksFetchedSuccessfully = true;
    // console.log("Affiliate links fetched and cached:", COURSE_AFFILIATE_LINKS_CACHE);
  } catch (error) {
    console.error("Error fetching and caching affiliate links from Firestore:", error);
    // If fetching fails, we might want to allow retries or handle this state.
    // For now, linksFetchedSuccessfully remains false, and the cache might be empty or stale.
  }
}

// Synchronously finds an affiliate link in the cache.
// Assumes fetchAndCacheAffiliateLinks has been called.
export function findAffiliateLinkInCache(courseTitle: string): CourseLink | undefined {
  if (!courseTitle || !linksFetchedSuccessfully) {
    // If links haven't been fetched or title is invalid, return undefined.
    return undefined;
  }
  
  const normalizedCourseTitle = courseTitle.toLowerCase().trim();
  return COURSE_AFFILIATE_LINKS_CACHE.find(
    link => link.title.toLowerCase().trim() === normalizedCourseTitle
  );
}

// This export might not be needed externally if components use the functions above.
// export { COURSE_AFFILIATE_LINKS_CACHE as MANAGED_AFFILIATE_LINKS_CACHE };
