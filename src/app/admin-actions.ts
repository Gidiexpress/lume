
'use server';
import { z } from 'zod';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { CourseLink } from '@/lib/affiliateLinks'; // Assuming CourseLink interface is here

// Zod Schema for validating affiliate links
const AffiliateLinkSchema = z.object({
  id: z.string().optional(), // Firestore document ID, optional for creation
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

// Fetch all affiliate links
export async function getAffiliateLinks(): Promise<AdminActionState> {
  try {
    const affiliateLinksCollection = collection(db, 'affiliateLinks');
    const snapshot = await getDocs(affiliateLinksCollection);
    const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseLink));
    return { success: true, message: 'Affiliate links fetched successfully.', data: links };
  } catch (error) {
    console.error("Error fetching affiliate links:", error);
    return { success: false, message: 'Failed to fetch affiliate links.', data: [] };
  }
}

// Add a new affiliate link
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

  // Check if title already exists to prevent duplicates as title is used as a key
  const q = query(collection(db, "affiliateLinks"), where("title", "==", title));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return { success: false, message: `An affiliate link with the title "${title}" already exists.` };
  }

  try {
    const docRef = await addDoc(collection(db, 'affiliateLinks'), { title, affiliateUrl, displayText });
    return { success: true, message: 'Affiliate link added successfully.', data: { id: docRef.id, title, affiliateUrl, displayText } };
  } catch (error) {
    console.error("Error adding affiliate link:", error);
    return { success: false, message: 'Failed to add affiliate link.' };
  }
}

// Update an existing affiliate link
export async function updateAffiliateLink(formData: FormData): Promise<AdminActionState> {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: "Link ID is missing." };
  }

  const validatedFields = AffiliateLinkSchema.safeParse({
    id: id,
    title: formData.get('title'), // Title typically shouldn't change if it's a key, but allow for now.
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
    const linkDocRef = doc(db, 'affiliateLinks', id);
    await updateDoc(linkDocRef, { title, affiliateUrl, displayText });
    return { success: true, message: 'Affiliate link updated successfully.', data: { id, title, affiliateUrl, displayText } };
  } catch (error) {
    console.error("Error updating affiliate link:", error);
    return { success: false, message: 'Failed to update affiliate link.' };
  }
}

// Delete an affiliate link
export async function deleteAffiliateLink(id: string): Promise<AdminActionState> {
  if (!id) {
    return { success: false, message: "Link ID is missing." };
  }
  try {
    const linkDocRef = doc(db, 'affiliateLinks', id);
    await deleteDoc(linkDocRef);
    return { success: true, message: 'Affiliate link deleted successfully.' };
  } catch (error) {
    console.error("Error deleting affiliate link:", error);
    return { success: false, message: 'Failed to delete affiliate link.' };
  }
}
