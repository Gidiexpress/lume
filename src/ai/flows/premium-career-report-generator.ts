
'use server';
/**
 * @fileOverview Generates a detailed premium career path report.
 *
 * - generatePremiumCareerPath - A function that generates the premium career path.
 * - PremiumCareerPathInput - The input type (same as CareerPathInput).
 * - PremiumCareerPathOutput - The return type for the premium career path function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CareerPathInput } from './career-path-generator'; // Re-using the input type

// Define the detailed output schema for the Premium Report
const PremiumCareerPathOutputSchema = z.object({
  jobRoles: z.array(z.string()).describe('A list of 3-5 relevant job roles based on field of study, with brief descriptions for each.'),
  technicalSkillsToDevelop: z.array(z.string()).describe('A comprehensive list of technical skills to master, categorized by importance (e.g., foundational, advanced).'),
  softSkillsToBuild: z.array(z.string()).describe('A detailed list of essential soft skills, with examples of how to develop them.'),
  toolsAndSoftware: z.array(z.string()).describe('An extensive list of common tools, software, and platforms used in these roles.'),
  
  careerSummary: z.string().describe("An in-depth summary of the chosen career path, including long-term outlook and potential specializations."),
  careerRoadmap: z.array(z.object({
    stage: z.string().describe("e.g., Beginner (0-1 year), Intermediate (1-3 years), Advanced (3+ years)"),
    focus: z.string().describe("Main goals and focus areas for this stage."),
    skillsToLearn: z.array(z.string()).describe("Specific skills to acquire or hone during this stage."),
    projectExamples: z.array(z.string()).describe("Example projects suitable for this stage."),
    milestones: z.array(z.string()).describe("Key milestones to achieve.")
  })).describe("A step-by-step roadmap from beginner to professional level."),
  
  skillGapAnalysis: z.object({
    identifiedCurrentSkills: z.array(z.string()).optional().describe("Skills identified from user's input or inferred."),
    essentialSkillsForPath: z.array(z.string()).describe("Essential skills required for the desired career path."),
    skillsToBridge: z.array(z.string()).describe("Specific skills the user needs to develop to bridge the gap.")
  }).describe("Analysis of the user's current skills against required skills for the path."),
  
  learningResources: z.array(z.object({
    category: z.string().describe("e.g., Foundational Concepts, Programming Languages, Tools & Platforms, Specializations"),
    resources: z.array(z.object({
      title: z.string().describe("Name of the course, book, or resource."),
      type: z.enum(['Course', 'Book', 'Website', 'Community', 'Video Series', 'Tutorial', 'Documentation', 'Other']).describe("Type of resource."),
      urlSuggestion: z.string().optional().describe("A suggested platform or search term (e.g., Coursera, Udemy, YouTube channel, specific documentation site). AI should not invent full URLs."),
      isFree: z.boolean().describe("Whether the resource is typically free or paid.")
    }))
  })).describe("Curated list of learning resources, categorized and indicating if free or paid. Include a mix of types."),
  
  recommendedCertifications: z.array(z.object({
    name: z.string().describe("Name of the certification."),
    issuingBody: z.string().describe("e.g., Google, AWS, CompTIA, Microsoft, Cisco"),
    relevance: z.string().describe("Why this certification is relevant for the career path.")
  })).describe("Industry-recognized certifications relevant to the career path."),
  
  sampleProjectsDetailed: z.array(z.object({
    title: z.string().describe("Title of the project."),
    description: z.string().describe("A brief overview of the project and its objectives."),
    learningOutcomes: z.array(z.string()).describe("What the user will learn by completing it."),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe("Project difficulty level.")
  })).describe("More detailed sample project ideas with learning outcomes and difficulty."),
  
  resumeTips: z.array(z.string()).describe("Actionable tips for tailoring a resume to this career path, including keywords, sections to emphasize, and achievements to highlight."),
  
  jobMarketInsight: z.object({
    localNigeria: z.string().describe("Insights into the Nigerian job market for this career path, including demand trends, typical salary ranges (if available and general), key industries/employers, and networking tips specific to Nigeria."),
    remoteGlobal: z.string().describe("Insights into remote/global job opportunities, including popular platforms for finding remote roles, skills highly valued by international employers, and tips for working effectively in a remote setup.")
  }).describe("Overview of job market conditions, both locally in Nigeria and for remote opportunities worldwide."),
});
export type PremiumCareerPathOutput = z.infer<typeof PremiumCareerPathOutputSchema>;


// Re-using CareerPathInputSchema from the free report generator
const CareerPathInputSchema = z.object({
  fullName: z.string().describe("The user's full name."),
  email: z.string().email().describe("The user's email address."),
  university: z.string().describe("The user's university or institution."),
  fieldOfStudy: z.string().describe("The user's field of study."),
  currentSkills: z.string().optional().describe("The user's current skills. This is crucial for skill gap analysis."),
  desiredCareerPath: z.string().optional().describe("The user's desired career path. This heavily influences the report."),
  learningPreference: z.string().describe("The user's preferred learning style (e.g., Online, Hybrid, In-person)."),
});
export type PremiumCareerPathInput = z.infer<typeof CareerPathInputSchema>;


export async function generatePremiumCareerPath(input: PremiumCareerPathInput): Promise<PremiumCareerPathOutput> {
  return premiumReportFlow(input);
}

const premiumReportPrompt = ai.definePrompt({
  name: 'premiumCareerPathGeneratorPrompt',
  input: {schema: CareerPathInputSchema},
  output: {schema: PremiumCareerPathOutputSchema},
  prompt: `You are an expert career counselor and AI strategist, tasked with generating a comprehensive, premium career guidance report for a Nigerian student/recent graduate. This report should be highly detailed, actionable, and tailored to their profile.

User Details:
- Full Name: {{{fullName}}}
- Email: {{{email}}}
- University: {{{university}}}
- Field of Study: {{{fieldOfStudy}}}
{{#if currentSkills}}- Current Skills: {{{currentSkills}}} (Use this for skill gap analysis. If empty, note that skill gap analysis will be more general.){{/if}}
{{#if desiredCareerPath}}- Desired Career Path: {{{desiredCareerPath}}} (This is the primary focus. If empty, suggest paths based on fieldOfStudy and provide the report for the most prominent one.){{/if}}
- Learning Preference: {{{learningPreference}}}

GENERATE A PREMIUM REPORT WITH THE FOLLOWING SECTIONS. BE THOROUGH AND PROVIDE SUBSTANTIAL CONTENT FOR EACH:

1.  **Job Roles (3-5 roles):**
    *   List relevant job roles based on their field of study and desired career path.
    *   For each role, provide a brief description (2-3 sentences).

2.  **Technical Skills to Develop:**
    *   Provide a comprehensive list of technical skills.
    *   Categorize them: Foundational, Intermediate, Advanced.
    *   Briefly explain why each skill is important.

3.  **Soft Skills to Build:**
    *   List essential soft skills (e.g., communication, problem-solving, teamwork, adaptability, critical thinking).
    *   For each, provide 1-2 examples of how to develop or demonstrate it.

4.  **Tools and Software:**
    *   List common tools, software, and platforms relevant to the suggested job roles.
    *   Include a mix of industry-standard and emerging tools.

5.  **Career Summary:**
    *   An in-depth summary (2-3 paragraphs) of the chosen/suggested career path.
    *   Discuss long-term outlook, potential specializations, and growth opportunities in Nigeria and globally.

6.  **Career Roadmap (Beginner to Pro):**
    *   Create a multi-stage roadmap (e.g., Beginner: 0-1 yr, Intermediate: 1-3 yrs, Advanced: 3+ yrs).
    *   For each stage:
        *   **Focus:** Main goals and learning objectives.
        *   **SkillsToLearn:** Specific skills to acquire or hone.
        *   **ProjectExamples:** Types of projects to undertake.
        *   **Milestones:** Key achievements or milestones for that stage.

7.  **Skill Gap Analysis:**
    *   **IdentifiedCurrentSkills:** List skills from user input or infer based on field of study if not provided.
    *   **EssentialSkillsForPath:** List key skills needed for the target career path.
    *   **SkillsToBridge:** Highlight the specific skills the user should focus on developing.
    *   If no current skills are provided, state that the analysis is general.

8.  **Learning Resources:**
    *   Provide a categorized list of learning resources (e.g., Foundational Concepts, Programming, Tools, Specializations).
    *   For each category, list 3-5 resources.
    *   For each resource:
        *   **Title:** Name of the course, book, platform, etc.
        *   **Type:** (Course, Book, Website, Community, Video Series, Tutorial, Documentation, Other).
        *   **UrlSuggestion:** Suggest a platform (e.g., Coursera, Udemy, freeCodeCamp, official documentation site) or search terms. DO NOT invent full URLs.
        *   **IsFree:** Indicate if typically free or paid.
    *   Ensure a mix of resource types and include resources relevant to the Nigerian context if possible (e.g., local communities).

9.  **Recommended Certifications:**
    *   List 2-4 industry-recognized certifications.
    *   For each: Name, IssuingBody, and Relevance to the career path.

10. **Sample Projects (Detailed):**
    *   Provide 2-3 detailed sample project ideas.
    *   For each: Title, Description (what it involves), LearningOutcomes, Difficulty (Beginner, Intermediate, Advanced).

11. **Resume Tips:**
    *   Provide 5-7 actionable tips for tailoring their resume.
    *   Include advice on keywords, structuring the resume, highlighting projects, and quantifying achievements, especially for entry-level candidates.

12. **Job Market Insight:**
    *   **LocalNigeria:** Discuss demand in Nigeria, typical salary expectations (general ranges if possible, e.g., "entry-level roles in Lagos might range from X to Y Naira monthly"), key industries/employers, and Nigerian-specific job boards or networking avenues.
    *   **RemoteGlobal:** Discuss remote opportunities, skills valued globally, platforms for remote jobs (e.g., LinkedIn, Upwork, We Work Remotely), and tips for succeeding in a remote role.

VERY IMPORTANT: Ensure all fields in the output schema are populated with rich, detailed, and practical information. The user is paying for this report, so it must be comprehensive and valuable.
If 'desiredCareerPath' is not specified, select the most suitable one based on 'fieldOfStudy' and generate the report for that.
If 'currentSkills' are not provided by the user, the 'identifiedCurrentSkills' field in 'skillGapAnalysis' can be an empty array or state that it's based on general assumptions for the field of study, and 'skillsToBridge' should then list all essential skills as needing development.
The output should be well-structured according to the schema.
`,
  config: {
    safetySettings: [ // Allow for more comprehensive, potentially sensitive advice within safety limits
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const premiumReportFlow = ai.defineFlow(
  {
    name: 'premiumReportFlow',
    inputSchema: CareerPathInputSchema,
    outputSchema: PremiumCareerPathOutputSchema,
  },
  async input => {
    // Simulate payment check - in a real app, this would be a call to a payment service
    console.log("Simulating payment verification for premium report for:", input.email);
    // Assume payment is successful to proceed

    const {output} = await premiumReportPrompt(input);
    if (!output) {
      throw new Error("Premium report generation failed to produce output.");
    }
    return output;
  }
);

    