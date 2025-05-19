
'use server';
/**
 * @fileOverview Generates a detailed premium career path report.
 *
 * - generatePremiumCareerPath - A function that generates the premium career path.
 * - PremiumCareerPathInput - The input type (maps from app's CareerPathInput).
 * - PremiumCareerPathOutput - The return type for the premium career path function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// Use the app-standard input type for the exported function
import type { CareerPathInput as AppStandardCareerPathInput } from './career-path-generator';

// Define the prompt-specific input schema based on Handlebars variables in the new prompt
const PremiumPromptInputSchema = z.object({
  name: z.string().describe("The user's full name."),
  user_field: z.string().describe("The user's field of study."),
  career_path: z.string().describe("The user's desired career path."),
  skills: z.string().optional().describe("The user's current skills (if provided)."),
  learning_mode: z.string().describe("The user's preferred learning mode (e.g., online, self-paced, hybrid)."),
  additionalContext: z.string().optional().describe("Additional context or questions from the user (if any)."),
});
export type PremiumPromptInput = z.infer<typeof PremiumPromptInputSchema>;


// Define the detailed output schema for the Premium Report based on the new prompt
const PremiumCareerPathOutputSchema = z.object({
  careerRoleSummary: z.object({
    roleTitle: z.string().describe("The specific career role being summarized."),
    explanation: z.string().describe("Practical explanation of the role, tailored for someone new."),
    typicalResponsibilities: z.array(z.string()).describe("List of typical responsibilities and day-to-day tasks."),
    specializations: z.array(z.object({
      name: z.string().describe("Name of the specialization within the role."),
      description: z.string().describe("Brief description of the specialization.")
    })).optional().describe("Breakdown of career specializations within the role (e.g., frontend vs backend).")
  }).describe("Section 1: Career Role Summary"),

  careerRoadmap: z.array(z.object({
    stageName: z.string().describe("Name of the stage, e.g., Beginner (0-3 months), Intermediate (3-12 months), Pro-level (1-2 years)."),
    duration: z.string().describe("Typical duration for this stage."),
    focusAreas: z.array(z.string()).describe("Main goals and focus areas for this stage."),
    skillsToDevelop: z.array(z.string()).describe("Specific skills to acquire or hone during this stage."),
    projectExamples: z.array(z.string()).describe("Example projects suitable for this stage."),
    typicalJobTitles: z.array(z.string()).optional().describe("Typical job titles at this stage and progression notes."),
    keyMilestones: z.array(z.string()).describe("Key milestones to achieve.")
  })).describe("Section 2: Career Roadmap from beginner to professional."),

  skillGapAssessment: z.object({
    probableExistingSkills: z.array(z.string()).describe("Skills the user likely already possesses based on their field of study, including soft skills."),
    criticalSkillsToLearn: z.array(z.string()).describe("Critical skills the user needs to learn for the desired career path."),
    skillReadinessScore: z.number().min(0).max(100).describe("A simple Skill Readiness Score out of 100."),
    readinessExplanation: z.string().describe("A short explanation for the Skill Readiness Score.")
  }).describe("Section 3: Skill Gap Assessment"),

  learningResources: z.array(z.object({
    title: z.string().describe("Course Title."),
    platform: z.string().describe("Platform (e.g., Coursera, ALX, Udemy, YouTube, Sololearn)."),
    urlSuggestion: z.string().describe("A URL or a search term for finding the resource. AI should prioritize official/main platform URLs if possible but not invent full course URLs unless easily verifiable and public."),
    isFree: z.boolean().optional().describe("Whether the resource is typically free or paid.")
  })).min(5).describe("Section 4: List of at least 5 hand-picked, high-quality learning resources. URLs should be for the platform or main course page if known, not deep affiliate links."),

  recommendedCertifications: z.array(z.object({
    name: z.string().describe("Name of the certification."),
    issuingBody: z.string().describe("e.g., Google, AWS, CompTIA, Microsoft, Cisco."),
    estimatedCost: z.string().optional().describe("Cost estimate (e.g., $100-$200, Free, Varies)."),
    hiringBenefit: z.string().describe("How this certification helps the user get hired.")
  })).min(3).describe("Section 5: At least 3 relevant certifications with cost and benefits."),

  toolsAndSoftware: z.object({
    beginner: z.array(z.string()).describe("Essential tools for beginners."),
    intermediate: z.array(z.string()).describe("Tools for intermediate users."),
    advanced: z.array(z.string()).describe("Advanced tools for professionals.")
  }).describe("Section 6: Essential tools or software, grouped by level."),

  sampleProjects: z.array(z.object({
    title: z.string().describe("Title of the project idea."),
    problemStatement: z.string().describe("A short one-line problem statement for the project."),
    learningOutcomes: z.array(z.string()).optional().describe("What the user will learn."),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().describe("Project difficulty.")
  })).min(2).max(3).describe("Section 7: 2-3 simple, real-world project ideas with problem statements."),

  softSkills: z.array(z.object({
    skillName: z.string().describe("Name of the key soft skill."),
    importance: z.string().optional().describe("Why this soft skill is important for the role."),
    improvementSuggestion: z.string().describe("How the user can improve this soft skill (e.g., volunteer, clubs).")
  })).describe("Section 8: Key soft skills needed and how to improve them."),

  jobMarketInsight: z.object({
    entryLevelSalaryNigeria: z.string().describe("Entry-level salary range in Nigeria (e.g., N150,000 - N300,000 monthly)."),
    globalRemoteOutlook: z.string().describe("Outlook on global remote job availability for this role."),
    remoteWorkPopularity: z.string().describe("Comment on whether remote work is possible or popular in this field.")
  }).describe("Section 9: Job Market Insight with salary, remote work info."),

  resumeWritingTips: z.object({
    tips: z.array(z.string().describe("Specific resume optimization tip for this role.")).min(3).describe("At least 3 resume optimization tips."),
    hiringManagerFocus: z.string().describe("What hiring managers look for in freshers for this role.")
  }).describe("Section 10: Resume writing tips and what hiring managers look for.")
});
export type PremiumCareerPathOutput = z.infer<typeof PremiumCareerPathOutputSchema>;


export async function generatePremiumCareerPath(appInput: AppStandardCareerPathInput): Promise<PremiumCareerPathOutput> {
  // Map the application-standard input to the prompt-specific input
  const promptInput: PremiumPromptInput = {
    name: appInput.fullName,
    user_field: appInput.fieldOfStudy,
    career_path: appInput.desiredCareerPath || "Not specified by user", // Provide a default if empty
    skills: appInput.currentSkills || undefined, // Pass as undefined if empty, as schema expects optional string
    learning_mode: appInput.learningPreference,
    additionalContext: appInput.additionalContext || undefined,
  };
  return premiumReportFlow(promptInput);
}

const premiumReportPrompt = ai.definePrompt({
  name: 'premiumCareerGuidancePrompt',
  // model: 'groq/llama3-70b-8192', // Removed Groq model specification, will use default Genkit model
  input: {schema: PremiumPromptInputSchema}, 
  output: {schema: PremiumCareerPathOutputSchema}, 
  prompt: `You are a career development expert helping university students and recent graduates in Nigeria transition into job-ready professionals.

The user has already selected a desired career path and shared their academic background. Your job is to generate a premium-quality career guidance report that includes:

---

1.  **Career Role Summary**
    *   A practical explanation of the selected role, tailored for someone new.
    *   Explain typical responsibilities and day-to-day tasks.
    *   Break down career specializations within the role (e.g., frontend vs backend for developers).

2.  **Career Roadmap**
    *   Break down a realistic roadmap from beginner to professional in 3 stages:
        *   Beginner (0–3 months)
        *   Intermediate (3–12 months)
        *   Pro-level (1–2 years)
    *   Mention typical job titles and progression for each stage.
    *   Include focus areas, skills to develop, project examples, and key milestones for each stage.

3.  **Skill Gap Assessment**
    *   Based on the user’s background (field of study: {{user_field}}, current skills: {{skills}}), list:
        *   Probable existing skills they likely already have (even soft skills from their field of study).
        *   Critical skills they need to learn for the desired career path: {{career_path}}.
    *   Assign a simple “Skill Readiness Score” out of 100 with a short explanation, considering their background for {{career_path}}.

4.  **Learning Resources**
    *   List at least 5 hand-picked, high-quality courses (free or paid).
    *   For each, provide: Title, Platform (e.g., Coursera, ALX, Udemy, YouTube, Sololearn), and a URL suggestion (main platform URL or direct course page if publicly known and stable. DO NOT invent full deep course URLs or affiliate links). Indicate if free or paid.
    *   Example Format: Title: Introduction to Python, Platform: Coursera, UrlSuggestion: https://www.coursera.org, IsFree: false (or true)

5.  **Certifications**
    *   Recommend at least 3 relevant certifications for {{career_path}}.
    *   For each, include: Name, IssuingBody, Estimated Cost (e.g., "$100", "Varies", "Free"), and a brief explanation of how it helps the user get hired.

6.  **Tools & Software**
    *   List essential tools or software used in the role of {{career_path}}.
    *   Group them as beginner, intermediate, and advanced.

7.  **Sample Projects**
    *   Suggest 2–3 simple, real-world project ideas relevant to {{career_path}}.
    *   Include a short one-line problem statement for each project.
    *   Optionally list learning outcomes and difficulty.

8.  **Soft Skills**
    *   Highlight key soft skills needed for success in {{career_path}}.
    *   For each skill, suggest how the user can improve them (e.g., volunteer, join clubs, online workshops).

9.  **Job Market Insight for {{career_path}}**
    *   Provide a quick outlook on job opportunities:
        *   Entry-level salary range in Nigeria (e.g., "N150,000 - N300,000 per month").
        *   Global remote job availability (e.g., "High", "Moderate", "Low with opportunities on specific platforms").
        *   Mention if remote work is generally possible or popular in this field.

10. **Resume Writing Tips for {{career_path}}**
    *   Give at least 3 resume optimization tips tailored for this role.
    *   Highlight what hiring managers in Nigeria typically look for in freshers applying for {{career_path}}.

---

🔒 The tone should be:
- Friendly, encouraging, and professional.
- Use bullet points, short paragraphs, and clear headers for readability.
- Avoid jargon. Assume the reader is a student or young graduate unfamiliar with the corporate world.

---

🧑‍🎓 USER INPUT:
- Name: {{name}}
- Field of Study: {{user_field}}
- Desired Career Path: {{career_path}}
{{#if skills}}- Current Skills: {{skills}}{{else}}- Current Skills: Not specified{{/if}}
- Preferred Learning Mode: {{learning_mode}}
{{#if additionalContext}}- Additional Context: {{additionalContext}}{{else}}- Additional Context: None{{/if}}

Generate the complete premium career report for this user according to the schema. Ensure all fields in the output schema are populated with rich, detailed, and practical information.
The user is paying for this report, so it must be comprehensive and valuable.
If 'desiredCareerPath' is "Not specified by user", select the most suitable one based on 'fieldOfStudy' and generate the report for that, clearly stating the chosen path.
If 'currentSkills' are not provided by the user, the 'probableExistingSkills' should be based on general assumptions for the field of study, and 'criticalSkillsToLearn' should then list all essential skills as needing development.
`,
  config: { // These safety settings are for Gemini; Groq may have different or no equivalent settings via Genkit
    safetySettings: [ 
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const premiumReportFlow = ai.defineFlow(
  {
    name: 'premiumReportGenerationFlow',
    inputSchema: PremiumPromptInputSchema, 
    outputSchema: PremiumCareerPathOutputSchema,
  },
  async (promptInput: PremiumPromptInput) => {
    console.log("Simulating payment verification for premium report for user:", promptInput.name);
    // Assume payment is successful to proceed

    // The prompt 'premiumReportPrompt' will now use the default Genkit model
    const {output} = await premiumReportPrompt(promptInput); 
    if (!output) {
      throw new Error("Premium report generation failed to produce output.");
    }
    return output;
  }
);

