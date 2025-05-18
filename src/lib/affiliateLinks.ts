export interface CourseLink {
  title: string; // Case-insensitive matching target
  affiliateUrl: string;
  displayText?: string; // Optional: if the link text should be different from the matched title
}

// Example affiliate links. Replace with actual data.
export const COURSE_AFFILIATE_LINKS: CourseLink[] = [
  { 
    title: "Introduction to Python", 
    affiliateUrl: "https://www.example.com/python-course?ref=lume",
    displayText: "Python for Beginners (View Course)" 
  },
  { 
    title: "Advanced JavaScript", 
    affiliateUrl: "https://www.example.com/advanced-js?ref=lume",
    displayText: "Master Advanced JavaScript (View Course)"
  },
  { 
    title: "Machine Learning Fundamentals", 
    affiliateUrl: "https://www.example.com/ml-fundamentals?ref=lume"
  },
  {
    title: "Data Structures and Algorithms in Java",
    affiliateUrl: "https://www.example.com/java-dsa?ref=lume",
    displayText: "Java Data Structures & Algorithms (View Course)"
  },
  {
    title: "UX Design Principles",
    affiliateUrl: "https://www.example.com/ux-design?ref=lume"
  }
];

export function findAffiliateLink(courseTitle: string): CourseLink | undefined {
  if (!courseTitle) return undefined;
  const normalizedCourseTitle = courseTitle.toLowerCase().trim();
  return COURSE_AFFILIATE_LINKS.find(
    link => link.title.toLowerCase().trim() === normalizedCourseTitle
  );
}
