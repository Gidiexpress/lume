
import { db } from '@/lib/firebase/config'; // Ensure Firebase is initialized
import { collection, getDocs, query, where } from 'firebase/firestore';

export interface CourseLink {
  id?: string; // Document ID from Firestore
  title: string; // Case-insensitive matching target
  affiliateUrl: string;
  displayText?: string; // Optional: if the link text should be different from the matched title
}

// This variable will now be populated from Firestore.
// It can serve as a cache to avoid frequent DB calls if needed, but for simplicity,
// findAffiliateLink will fetch directly or you can pre-fetch on app load.
let COURSE_AFFILIATE_LINKS: CourseLink[] = [];
let linksFetched = false;

// Function to fetch links from Firestore and cache them
export async function fetchAffiliateLinksFromDB(): Promise<CourseLink[]> {
  if (linksFetched && COURSE_AFFILIATE_LINKS.length > 0) {
    return COURSE_AFFILIATE_LINKS;
  }
  try {
    const affiliateLinksCollection = collection(db, 'affiliateLinks');
    const snapshot = await getDocs(affiliateLinksCollection);
    COURSE_AFFILIATE_LINKS = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseLink));
    linksFetched = true;
    return COURSE_AFFILIATE_LINKS;
  } catch (error) {
    console.error("Error fetching affiliate links from Firestore:", error);
    return []; // Return empty or previously cached links in case of error
  }
}


export async function findAffiliateLink(courseTitle: string): Promise<CourseLink | undefined> {
  if (!courseTitle) return undefined;

  // Ensure links are fetched if not already
  if (!linksFetched) {
    await fetchAffiliateLinksFromDB();
  }
  
  const normalizedCourseTitle = courseTitle.toLowerCase().trim();
  return COURSE_AFFILIATE_LINKS.find(
    link => link.title.toLowerCase().trim() === normalizedCourseTitle
  );
}

// To make links available for admin management (they are fetched in the component now)
// This constant export might not be directly used by the admin panel anymore if it fetches fresh data.
export { COURSE_AFFILIATE_LINKS as MANAGED_AFFILIATE_LINKS_CACHE };
