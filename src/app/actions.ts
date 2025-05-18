// 'use server'
'use server';

import { z } from 'zod';
import { generateCareerPath, type CareerPathInput, type CareerPathOutput } from '@/ai/flows/career-path-generator';

const CareerFormSchema = z.object({
  fieldOfStudy: z.string().min(3, { message: "Field of study must be at least 3 characters." }),
  careerInterests: z.string().optional(),
});

export interface FormState {
  message: string | null;
  fields?: Record<string, string>;
  issues?: string[];
  data?: CareerPathOutput | null;
  success: boolean;
}

export async function submitCareerFormAction(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const validatedFields = CareerFormSchema.safeParse({
    fieldOfStudy: formData.get('fieldOfStudy'),
    careerInterests: formData.get('careerInterests'),
  });

  if (!validatedFields.success) {
    const issues = validatedFields.error.issues.map((issue) => issue.message);
    return {
      message: "Invalid form data. " + issues.join(' '),
      issues,
      success: false,
    };
  }

  const input: CareerPathInput = {
    fieldOfStudy: validatedFields.data.fieldOfStudy,
    careerInterests: validatedFields.data.careerInterests || undefined,
  };

  try {
    const careerPath = await generateCareerPath(input);
    return {
      message: "Career path generated successfully!",
      data: careerPath,
      success: true,
    };
  } catch (error) {
    console.error("Error generating career path:", error);
    return {
      message: "Failed to generate career path. Please try again later.",
      success: false,
    };
  }
}


const EmailSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  resultsText: z.string().min(1, { message: "Results text cannot be empty." }),
});

export interface EmailFormState {
  message: string | null;
  success: boolean;
}

export async function emailResultsAction(
  prevState: EmailFormState | undefined,
  formData: FormData
): Promise<EmailFormState> {
  const validatedFields = EmailSchema.safeParse({
    email: formData.get('email'),
    resultsText: formData.get('resultsText'),
  });

  if (!validatedFields.success) {
    return {
      message: "Invalid data: " + validatedFields.error.issues.map(i => i.message).join(', '),
      success: false,
    };
  }
  
  const { email, resultsText } = validatedFields.data;

  // In a real application, you would integrate an email sending service here.
  // For this example, we'll just log it to the console.
  console.log(`Emailing results to: ${email}`);
  console.log(`Content:\n${resultsText}`);
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    message: `Career path successfully sent to ${email}!`,
    success: true,
  };
}
