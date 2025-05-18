
'use server';

import { z } from 'zod';
import { generateCareerPath, type CareerPathInput, type CareerPathOutput } from '@/ai/flows/career-path-generator';
import { generatePremiumCareerPath, type PremiumCareerPathOutput } from '@/ai/flows/premium-career-report-generator';

const CareerFormSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  university: z.string().min(3, { message: "University/Institution must be at least 3 characters." }),
  fieldOfStudy: z.string().min(3, { message: "Field of study must be at least 3 characters." }),
  currentSkills: z.string().optional(),
  desiredCareerPath: z.string().optional(),
  learningPreference: z.string().min(3, { message: "Learning preference must be at least 3 characters." }),
  additionalContext: z.string().optional(),
  reportType: z.enum(['free', 'premium'], { message: "Invalid report type selected." }),
});

// This input schema is used by generatePremiumReportAction when it receives direct object input
// It should mirror CareerPathInput which is used by generatePremiumCareerPath
const PremiumReportInputSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  university: z.string().min(3, { message: "University/Institution must be at least 3 characters." }),
  fieldOfStudy: z.string().min(3, { message: "Field of study must be at least 3 characters." }),
  currentSkills: z.string().optional(),
  desiredCareerPath: z.string().optional(),
  learningPreference: z.string().min(3, { message: "Learning preference must be at least 3 characters." }),
  additionalContext: z.string().optional(),
});


export interface FormState {
  message: string | null;
  fields?: Record<string, string>;
  issues?: string[];
  data?: CareerPathOutput | PremiumCareerPathOutput | null; // Can hold free or premium data
  success: boolean;
  reportType?: 'free' | 'premium';
}

export async function submitCareerFormAction(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  // This action is now only for FREE reports from the main form
  const validatedFields = CareerFormSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    university: formData.get('university'),
    fieldOfStudy: formData.get('fieldOfStudy'),
    currentSkills: formData.get('currentSkills'),
    desiredCareerPath: formData.get('desiredCareerPath'),
    learningPreference: formData.get('learningPreference'),
    additionalContext: formData.get('additionalContext'),
    reportType: 'free', // Hardcode to free as this form is for free reports
  });

  if (!validatedFields.success) {
    const issues = validatedFields.error.issues.map((issue) => issue.message);
    return {
      message: "Invalid form data. " + issues.join(' '),
      issues,
      success: false,
      reportType: 'free',
    };
  }
  
  const { reportType, ...careerInputs } = validatedFields.data;

  const input: CareerPathInput = {
    fullName: careerInputs.fullName,
    email: careerInputs.email,
    university: careerInputs.university,
    fieldOfStudy: careerInputs.fieldOfStudy,
    currentSkills: careerInputs.currentSkills || undefined,
    desiredCareerPath: careerInputs.desiredCareerPath || undefined,
    learningPreference: careerInputs.learningPreference,
    additionalContext: careerInputs.additionalContext || undefined,
  };

  try {
    const careerPath = await generateCareerPath(input); 
    return {
      message: 'Free career path generated successfully!',
      data: careerPath,
      success: true,
      reportType: 'free',
    };
  } catch (error) {
    console.error("Error generating free career path:", error);
    return {
      message: "Failed to generate free career path. Please try again later.",
      success: false,
      reportType: 'free',
    };
  }
}

export async function generatePremiumReportAction(
  prevState: FormState | undefined,
  inputData: CareerPathInput // Accepts CareerPathInput directly (which now includes additionalContext)
): Promise<FormState> {
  const validatedFields = PremiumReportInputSchema.safeParse(inputData);

  if (!validatedFields.success) {
    const issues = validatedFields.error.issues.map((issue) => issue.message);
    return {
      message: "Invalid input data for premium report. " + issues.join(' '),
      issues,
      success: false,
      reportType: 'premium',
    };
  }

  console.log("Premium report requested for:", validatedFields.data.email, "- Simulating payment verification...");
  const paymentSuccessful = true; 

  if (!paymentSuccessful) {
    return {
      message: "Payment failed or was not completed. Please try again.",
      success: false,
      reportType: 'premium',
    };
  }

  console.log("Payment successful (simulated). Generating premium report...");

  try {
    // Pass validated data (which is of type CareerPathInput) to the premium career path generator
    const premiumCareerPath = await generatePremiumCareerPath(validatedFields.data as CareerPathInput);
    return {
      message: 'Premium career path generated successfully!',
      data: premiumCareerPath,
      success: true,
      reportType: 'premium',
    };
  } catch (error) {
    console.error("Error generating premium career path:", error);
    let errorMessage = "Failed to generate premium career path. Please try again later.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return {
      message: errorMessage,
      success: false,
      reportType: 'premium',
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
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    message: `Career path successfully sent to ${email}!`,
    success: true,
  };
}
    
