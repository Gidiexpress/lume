
'use server';

import { z } from 'zod';
import { generateCareerPath, type CareerPathInput, type CareerPathOutput } from '@/ai/flows/career-path-generator';

const CareerFormSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  university: z.string().min(3, { message: "University/Institution must be at least 3 characters." }),
  fieldOfStudy: z.string().min(3, { message: "Field of study must be at least 3 characters." }),
  currentSkills: z.string().optional(),
  desiredCareerPath: z.string().optional(),
  learningPreference: z.string().min(3, { message: "Learning preference must be at least 3 characters." }),
  reportType: z.enum(['free', 'premium'], { message: "Invalid report type selected." }),
});

export interface FormState {
  message: string | null;
  fields?: Record<string, string>;
  issues?: string[];
  data?: CareerPathOutput | null;
  success: boolean;
  reportType?: 'free' | 'premium';
}

export async function submitCareerFormAction(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const reportType = formData.get('reportType') as ('free' | 'premium' | null);

  const validatedFields = CareerFormSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    university: formData.get('university'),
    fieldOfStudy: formData.get('fieldOfStudy'),
    currentSkills: formData.get('currentSkills'),
    desiredCareerPath: formData.get('desiredCareerPath'),
    learningPreference: formData.get('learningPreference'),
    reportType: reportType,
  });

  if (!validatedFields.success) {
    const issues = validatedFields.error.issues.map((issue) => issue.message);
    return {
      message: "Invalid form data. " + issues.join(' '),
      issues,
      success: false,
      reportType: reportType || 'free',
    };
  }
  
  const { reportType: validatedReportType, ...careerInputs } = validatedFields.data;

  // For now, premium report button won't trigger payment or a different AI flow.
  // This will be implemented in a future step.
  if (validatedReportType === 'premium') {
    // Placeholder for premium logic/payment check
    console.log("Premium report requested. Payment and specialized AI flow to be implemented.");
    // For now, it will proceed like a free report.
  }

  const input: CareerPathInput = {
    fullName: careerInputs.fullName,
    email: careerInputs.email,
    university: careerInputs.university,
    fieldOfStudy: careerInputs.fieldOfStudy,
    currentSkills: careerInputs.currentSkills || undefined,
    desiredCareerPath: careerInputs.desiredCareerPath || undefined,
    learningPreference: careerInputs.learningPreference,
    // careerInterests: validatedFields.data.careerInterests || undefined, // This field was removed from new form
  };

  try {
    // For now, all requests go to the same generator.
    // Future: if (validatedReportType === 'premium') { callPremiumGenerator(input); } else { callFreeGenerator(input); }
    const careerPath = await generateCareerPath(input); 
    return {
      message: `${validatedReportType === 'premium' ? 'Premium' : 'Free'} career path generated successfully! (Note: Premium features are under development)`,
      data: careerPath,
      success: true,
      reportType: validatedReportType,
    };
  } catch (error) {
    console.error("Error generating career path:", error);
    return {
      message: "Failed to generate career path. Please try again later.",
      success: false,
      reportType: validatedReportType,
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

  console.log(`Emailing results to: ${email}`);
  console.log(`Content:\n${resultsText}`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    message: `Career path successfully sent to ${email}!`,
    success: true,
  };
}

    