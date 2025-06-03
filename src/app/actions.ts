
'use server';

import { z } from 'zod';
import { generateCareerPath, type CareerPathInput, type CareerPathOutput } from '@/ai/flows/career-path-generator';
import { generatePremiumCareerPath, type PremiumCareerPathOutput } from '@/ai/flows/premium-career-report-generator'; 
import sgMail from '@sendgrid/mail';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
  data?: CareerPathOutput | PremiumCareerPathOutput | null; 
  success: boolean;
  reportType?: 'free' | 'premium';
}

async function logUserActivity(
  activityType: string,
  userId: string | undefined,
  careerInput: CareerPathInput,
  reportOutput: CareerPathOutput | PremiumCareerPathOutput | null
) {
  const supabase = createServerActionClient({ cookies });
  if (!reportOutput) return;

  let generatedPathNames: string[] = [];
  let skillReadinessScore: number | undefined = undefined;

  if ('suggestedCareerPaths' in reportOutput) {
    if (reportOutput.suggestedCareerPaths && Array.isArray(reportOutput.suggestedCareerPaths)) {
      generatedPathNames = reportOutput.suggestedCareerPaths.map((p: any) => p.pathName).filter(Boolean) as string[];
      
      // If it's a premium report structure, try to get the skill readiness score from the first path
      if (reportOutput.suggestedCareerPaths[0] && 'detailedReport' in reportOutput.suggestedCareerPaths[0]) {
        const firstDetailedReport = (reportOutput.suggestedCareerPaths[0] as any).detailedReport;
        if (firstDetailedReport && firstDetailedReport.skillGapAssessment) {
          skillReadinessScore = firstDetailedReport.skillGapAssessment.skillReadinessScore;
        }
      }
    }
  }


  const logData: any = {
    activity_type: activityType,
    field_of_study: careerInput.fieldOfStudy,
    generated_path_names: generatedPathNames.length > 0 ? generatedPathNames : null,
  };

  if (userId) {
    logData.user_id = userId;
  }
  if (skillReadinessScore !== undefined) {
    logData.skill_readiness_score = skillReadinessScore;
  }

  try {
    const { error: logError } = await supabase.from('user_activity_logs').insert(logData);
    if (logError) {
      console.error(`[Analytics Logging] Failed to log ${activityType}:`, JSON.stringify(logError, null, 2));
    } else {
      console.log(`[Analytics Logging] Successfully logged ${activityType} for user: ${userId || 'anonymous/guest'}`);
    }
  } catch (e) {
    console.error(`[Analytics Logging] Exception during ${activityType} logging:`, e);
  }
}

export async function submitCareerFormAction(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  const validatedFields = CareerFormSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    university: formData.get('university'),
    fieldOfStudy: formData.get('fieldOfStudy'),
    currentSkills: formData.get('currentSkills'),
    desiredCareerPath: formData.get('desiredCareerPath'),
    learningPreference: formData.get('learningPreference'),
    additionalContext: formData.get('additionalContext'),
    reportType: 'free', 
  });

  if (!validatedFields.success) {
    const issues = validatedFields.error.issues.map((issue) => issue.message);
    return {
      message: "Invalid form data. " + issues.join(' '),
      issues,
      success: false,
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
    
    // Log activity
    await logUserActivity('FREE_REPORT_GENERATED', user?.id, input, careerPath);

    return {
      message: 'Free career path generated successfully!',
      data: careerPath,
      success: true,
      reportType: 'free',
    };
  } catch (error) {
    console.error("Error generating free career path:", error);
    let errorMessage = "Failed to generate free career path. Please try again later.";
     if (error instanceof Error && error.message) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    return {
      message: errorMessage,
      success: false,
      reportType: 'free',
    };
  }
}

export async function generatePremiumReportAction(
  prevState: FormState | undefined,
  inputData: CareerPathInput 
): Promise<FormState> {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

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
  
  console.log("Premium report requested for:", validatedFields.data.email);

  try {
    const premiumCareerPath = await generatePremiumCareerPath(validatedFields.data as CareerPathInput);
    
    // Log activity
    // Note: 'PREMIUM_REPORT_PAYMENT_SUCCESS' would ideally be logged after Paystack webhook confirms payment server-side.
    // For now, we log generation.
    await logUserActivity('PREMIUM_REPORT_GENERATED', user?.id, validatedFields.data as CareerPathInput, premiumCareerPath);

    return {
      message: 'Premium career path generated successfully! Multiple paths suggested.',
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
  console.log('[Email Action] Attempting to send email...');
  const validatedFields = EmailSchema.safeParse({
    email: formData.get('email'),
    resultsText: formData.get('resultsText'),
  });

  if (!validatedFields.success) {
    const errorMessage = "Invalid data: " + validatedFields.error.issues.map(i => i.message).join(', ');
    console.error('[Email Action] Validation Error:', errorMessage);
    return {
      message: errorMessage,
      success: false,
    };
  }
  
  const { email, resultsText } = validatedFields.data;

  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL;

  console.log(`[Email Action] SendGrid API Key loaded: ${sendgridApiKey ? 'Yes (ends with ' + sendgridApiKey.slice(-5) + ')' : 'NO - MISSING!'}`);
  console.log(`[Email Action] SendGrid From Email loaded: ${sendgridFromEmail || 'NO - MISSING!'}`);

  if (!sendgridApiKey) {
    const errorMsg = "Email service is not configured (Admin error: API Key missing). Please try again later.";
    console.error(`[Email Action] ${errorMsg}`);
    return {
      message: errorMsg,
      success: false,
    };
  }
  if (!sendgridFromEmail) {
     const errorMsg = "Email service is not configured (Admin error: From Email missing). Please try again later.";
    console.error(`[Email Action] ${errorMsg}`);
    return {
      message: errorMsg,
      success: false,
    };
  }

  sgMail.setApiKey(sendgridApiKey);

  const htmlContent = resultsText.replace(/\n/g, '<br>');

  const msg = {
    to: email,
    from: sendgridFromEmail,
    subject: 'Your Lume Career Path Report',
    text: resultsText,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${htmlContent}</div>`,
  };

  console.log(`[Email Action] Sending email to: ${email} from: ${sendgridFromEmail}`);

  try {
    await sgMail.send(msg);
    console.log(`[Email Action] Career path report successfully sent to ${email} via SendGrid.`);
    return {
      message: `Career path successfully sent to ${email}!`,
      success: true,
    };
  } catch (error: any) {
    console.error('[Email Action] Error sending email with SendGrid:', error);
    let errorMessage = "Failed to send email. Please check server logs for details or contact support.";
    if (error.response) {
      console.error('[Email Action] SendGrid Error Response Code:', error.code); // SendGrid error objects might have 'code'
      console.error('[Email Action] SendGrid Error Body:', JSON.stringify(error.response.body || error.response.data, null, 2)); // body or data
      if (error.response.body && Array.isArray(error.response.body.errors) && error.response.body.errors.length > 0) {
        errorMessage = error.response.body.errors.map((e: any) => e.message).join('; ');
      } else if (typeof error.response.body === 'string') {
        errorMessage = error.response.body;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      message: errorMessage,
      success: false,
    };
  }
}
