
'use server';
/**
 * @fileOverview Generates a detailed premium career path report, suggesting multiple relevant paths.
 *
 * - generatePremiumCareerPath - A function that generates the premium career path.
 * - PremiumCareerPathInput - The input type (maps from app's CareerPathInput).
 * - PremiumCareerPathOutput - The return type for the premium career path function (contains multiple reports).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// Use the app-standard input type for the exported function
import type { CareerPathInput as AppStandardCareerPathInput } from './career-path-generator';

// Define the prompt-specific input schema based on Handlebars variables in the new prompt
const PremiumPromptInputSchema = z.object({
  name: z.string().describe("The user's full name."),
  user_field: z.string().describe("The user's field of study."),
  skills: z.string().optional().describe("The user's current skills (if provided)."),
  learning_mode: z.string().describe("The user's preferred learning mode (e.g., online, self-paced, hybrid)."),
  additionalContext: z.string().optional().describe("Additional context, potentially including user's desired career path or other notes."),
});
export type PremiumPromptInput = z.infer<typeof PremiumPromptInputSchema>;


// Define the detailed output schema for a single career path report
const SingleCareerPathReportSchema = z.object({
  careerRoleSummary: z.object({
    roleTitle: z.string().describe("The specific career role being summarized."),
    explanation: z.string().describe("Practical explanation of the role, tailored for someone new."),
    typicalResponsibilities: z.array(z.string()).describe("List of typical responsibilities and day-to-day tasks."),
    specializations: z.array(z.object({
      name: z.string().describe("Name of the specialization within the role."),
      description: z.string().describe("Brief description of the specialization.")
    })).optional().describe("Breakdown of career specializations within the role (e.g., frontend vs backend).")
  }).describe("Section 2: Career Role Summary for this path"),

  careerRoadmap: z.array(z.object({
    stageName: z.string().describe("Name of the stage, e.g., Beginner (0-3 months), Intermediate (3-12 months), Pro-level (1-2 years)."),
    duration: z.string().describe("Typical duration for this stage."),
    focusAreas: z.array(z.string()).describe("Main goals and focus areas for this stage."),
    skillsToDevelop: z.array(z.string()).describe("Specific skills to acquire or hone during this stage."),
    projectExamples: z.array(z.string()).describe("Example projects suitable for this stage."),
    typicalJobTitles: z.array(z.string()).optional().describe("Typical job titles at this stage and progression notes."),
    keyMilestones: z.array(z.string()).describe("Key milestones to achieve.")
  })).describe("Section 3: Career Roadmap from beginner to professional for this path."),

  skillGapAssessment: z.object({
    probableExistingSkills: z.array(z.string()).describe("Skills the user likely already possesses based on their field of study, including soft skills."),
    criticalSkillsToLearn: z.array(z.string()).describe("Critical skills the user needs to learn for this specific career path."),
    skillReadinessScore: z.number().min(0).max(100).describe("A simple Skill Readiness Score out of 100 for this path."),
    readinessExplanation: z.string().describe("A short explanation for the Skill Readiness Score for this path.")
  }).describe("Section 4: Skill Gap Assessment for this path"),

  learningResources: z.array(z.object({
    title: z.string().describe("Course Title."),
    platform: z.string().describe("Platform (e.g., Coursera, ALX, Udemy, YouTube, Sololearn)."),
    urlSuggestion: z.string().describe("A URL or a search term for finding the resource. AI should prioritize official/main platform URLs if possible but not invent full course URLs unless easily verifiable and public."),
    isFree: z.boolean().optional().describe("Whether the resource is typically free or paid.")
  })).min(5).describe("Section 5: List of at least 5 hand-picked, high-quality learning resources for this path. URLs should be for the platform or main course page if known, not deep affiliate links."),

  recommendedCertifications: z.array(z.object({
    name: z.string().describe("Name of the certification relevant to this path."),
    issuingBody: z.string().describe("e.g., Google, AWS, CompTIA, Microsoft, Cisco."),
    estimatedCost: z.string().optional().describe("Cost estimate (e.g., $100-$200, Free, Varies)."),
    hiringBenefit: z.string().describe("How this certification helps the user get hired for this path.")
  })).min(3).describe("Section 6: At least 3 relevant certifications with cost and benefits for this path."),

  toolsAndSoftware: z.object({
    beginner: z.array(z.string()).describe("Essential tools for beginners in this path."),
    intermediate: z.array(z.string()).describe("Tools for intermediate users in this path."),
    advanced: z.array(z.string()).describe("Advanced tools for professionals in this path.")
  }).describe("Section 7: Essential tools or software for this path, grouped by level."),

  sampleProjects: z.array(z.object({
    title: z.string().describe("Title of the project idea relevant to this path."),
    problemStatement: z.string().describe("A short one-line problem statement for the project."),
    learningOutcomes: z.array(z.string()).optional().describe("What the user will learn."),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().describe("Project difficulty.")
  })).min(2).max(3).describe("Section 8: 2-3 simple, real-world project ideas relevant to this path with problem statements."),

  softSkills: z.array(z.object({
    skillName: z.string().describe("Name of the key soft skill needed for this path."),
    importance: z.string().optional().describe("Why this soft skill is important for the role."),
    improvementSuggestion: z.string().describe("How the user can improve this soft skill (e.g., volunteer, clubs).")
  })).describe("Section 9: Key soft skills needed for this path and how to improve them."),

  jobMarketInsight: z.object({
    entryLevelSalaryNigeria: z.string().describe("Entry-level salary range in Nigeria for this path (e.g., N150,000 - N300,000 monthly)."),
    globalRemoteOutlook: z.string().describe("Outlook on global remote job availability for this role/path."),
    remoteWorkPopularity: z.string().describe("Comment on whether remote work is possible or popular in this field/path.")
  }).describe("Section 10: Job Market Insight for this path with salary, remote work info."),

  resumeWritingTips: z.object({
    tips: z.array(z.string().describe("Specific resume optimization tip for this role/path.")).min(3).describe("At least 3 resume optimization tips for this path."),
    hiringManagerFocus: z.string().describe("What hiring managers look for in freshers for this role/path.")
  }).describe("Section 11: Resume writing tips for this path and what hiring managers look for.")
});

// Define the overall output schema for the Premium Report, which includes multiple suggested paths
const PremiumMultiPathOutputSchema = z.object({
  suggestedCareerPaths: z.array(
    z.object({
      pathName: z.string().describe("The name of the suggested career path."),
      summary: z.string().describe("A brief summary of this career path and why it fits the user's background."),
      detailedReport: SingleCareerPathReportSchema.describe("The detailed report for this specific career path."),
    })
  ).min(1).describe("An array of 3 or more suggested career paths, each with a full detailed report."),
});
export type PremiumCareerPathOutput = z.infer<typeof PremiumMultiPathOutputSchema>;


export async function generatePremiumCareerPath(appInput: AppStandardCareerPathInput): Promise<PremiumCareerPathOutput> {
  let combinedAdditionalContext = appInput.additionalContext || "";
  if (appInput.desiredCareerPath) {
    combinedAdditionalContext = `The user has expressed an interest in: ${appInput.desiredCareerPath}. Please take this into consideration when suggesting career paths, but also provide other relevant options. ${combinedAdditionalContext}`;
  }

  const promptInput: PremiumPromptInput = {
    name: appInput.fullName,
    user_field: appInput.fieldOfStudy,
    skills: appInput.currentSkills || undefined,
    learning_mode: appInput.learningPreference,
    additionalContext: combinedAdditionalContext.trim() || undefined,
  };
  return premiumReportFlow(promptInput);
}

const premiumReportPrompt = ai.definePrompt({
  name: 'premiumMultiCareerGuidancePrompt',
  input: {schema: PremiumPromptInputSchema}, 
  output: {schema: PremiumMultiPathOutputSchema}, 
  prompt: `You are a career development expert helping university students and recent graduates in Nigeria transition into job-ready professionals.

The user has shared their academic background (course of study: {{user_field}}). Your job is to analyze their field of study and suggest 3 or more relevant career paths, then generate a comprehensive premium-quality career guidance report for each suggested path. Write the report in the second person using "you" and personalize it using the user's first name ({{name}}) where appropriate.

---
Output Structure for EACH suggested career path:

1. Suggested Career Paths (This section is top-level, list pathName and summary here for all paths, then details below for each)

   Based on your field of study ({{user_field}}), I suggest the following career paths for you, {{name}}:
   - Path 1: [Path Name]
     Summary: [Brief summary of Path 1 and why it fits your background.]
   - Path 2: [Path Name]
     Summary: [Brief summary of Path 2 and why it fits your background.]
   - Path 3: [Path Name]
     Summary: [Brief summary of Path 3 and why it fits your background.]
   (Suggest more if highly relevant)

Now, for EACH of the paths suggested above, provide the following detailed sections:

2. Career Role Summary (for the specific suggested path)
   - A practical explanation of the role, tailored for someone new like you.
   - Explain typical responsibilities and day-to-day tasks.
   - Break down career specializations within the role (e.g., frontend vs backend for developers).

3. Career Roadmap (for the specific suggested path)
   - Break down a realistic roadmap from beginner to professional in 3 stages:
     - Beginner (0–3 months)
     - Intermediate (3–12 months)
     - Pro-level (1–2 years)
   - Mention typical job titles and progression.
   - For each stage: include focus areas, skills to develop, project examples, and key milestones.

4. Skill Gap Assessment (for the specific suggested path)
   - Based on your background (field of study: {{user_field}}, current skills: {{#if skills}}{{{skills}}}{{else}}Not specified{{/if}}), list:
     - Skills you likely already have (including soft skills from your field of study).
     - Critical skills you need to learn for this career path.
   - Assign a simple “Skill Readiness Score” out of 100 with a short explanation for this path.

5. Learning Resources (for the specific suggested path)
   - List at least 5 hand-picked, high-quality courses (free or paid).
   - For each, provide: Title, Platform (e.g., Coursera, ALX, Udemy, YouTube, Sololearn), and a URL suggestion (main platform URL or direct course page if publicly known and stable. DO NOT invent full deep course URLs or affiliate links). Indicate if free or paid.
   - Example Format: Title: Introduction to Python, Platform: Coursera, UrlSuggestion: https://www.coursera.org, IsFree: false (or true)

6. Certifications (for the specific suggested path)
   - Recommend at least 3 relevant certifications for this career path.
   - For each, include: Name, IssuingBody, Estimated Cost (e.g., "$100", "Varies", "Free"), and a brief explanation of how it helps you get hired.

7. Tools & Software (for the specific suggested path)
   - List essential tools or software used in the role for this career path.
   - Group them as beginner, intermediate, and advanced.

8. Sample Projects (for the specific suggested path)
   - Suggest 2–3 simple, real-world project ideas relevant to this career path.
   - Include a short one-line problem statement for each project.
   - Optionally list learning outcomes and difficulty.

9. Soft Skills (for the specific suggested path)
   - Highlight key soft skills you’ll need to succeed in this career path.
   - For each skill, suggest how you can improve them (e.g., volunteering, joining clubs, peer mentoring).

10. Job Market Insight for this career path
    - Provide a quick outlook on job opportunities:
        - Entry-level salary range in Nigeria (e.g., "N150,000 - N300,000 per month").
        - Global remote job availability (e.g., "High", "Moderate", "Low with opportunities on specific platforms").
        - Mention if remote work is generally possible or popular in this field.

11. Resume Writing Tips for this career path
    - Give at least 3 resume optimization tips tailored for this role.
    - Highlight what hiring managers in Nigeria typically look for in freshers like you applying for this path.

---

🔒 The tone should be:
- Friendly, encouraging, and professional.
- Include bullet points, short paragraphs, and headers for readability.
- Avoid jargon. Assume the reader is a student or young graduate unfamiliar with the corporate world.
- Use second-person voice throughout (e.g., "you should consider..." instead of "they should consider..."). Personalize with {{name}} where appropriate.

---

🧑‍🎓 USER INPUT:
- Name: {{name}}
- Field of Study: {{user_field}}
{{#if skills}}- Current Skills: {{{skills}}}{{else}}- Current Skills: Not specified{{/if}}
- Preferred Learning Mode: {{learning_mode}}
{{#if additionalContext}}- Additional Context: {{{additionalContext}}}{{else}}- Additional Context: None{{/if}}

Generate the complete premium career report for {{name}} according to the multi-path output schema. Ensure all fields in the output schema are populated with rich, detailed, and practical information for EACH suggested path.
The user is paying for this report, so it must be comprehensive and valuable.
`,
  config: { 
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
    name: 'premiumMultiPathReportGenerationFlow',
    inputSchema: PremiumPromptInputSchema, 
    outputSchema: PremiumMultiPathOutputSchema,
  },
  async (promptInput: PremiumPromptInput) => {
    const {output} = await premiumReportPrompt(promptInput); 
    if (!output) {
      throw new Error("Premium report generation failed to produce output.");
    }
    return output;
  }
);

    