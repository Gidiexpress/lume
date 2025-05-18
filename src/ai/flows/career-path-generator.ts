
'use server';
/**
 * @fileOverview Generates a tailored career path based on the user's field of study and career interests.
 * This currently serves as the generator for the "Free Report".
 *
 * - generateCareerPath - A function that generates the career path.
 * - CareerPathInput - The input type for the generateCareerPath function.
 * - CareerPathOutput - The return type for the generateCareerPath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CareerPathInputSchema = z.object({
  fullName: z.string().describe("The user's full name."),
  email: z.string().email().describe("The user's email address."),
  university: z.string().describe("The user's university or institution."),
  fieldOfStudy: z.string().describe("The user's field of study."),
  currentSkills: z.string().optional().describe("The user's current skills."),
  desiredCareerPath: z.string().optional().describe("The user's desired career path."),
  learningPreference: z.string().describe("The user's preferred learning style (e.g., Online, Hybrid, In-person)."),
  // careerInterests: z.string().optional().describe('The user\'s career interests.'), // Replaced by desiredCareerPath and other fields
});
export type CareerPathInput = z.infer<typeof CareerPathInputSchema>;

// This output schema is for the "Free Report"
const CareerPathOutputSchema = z.object({
  jobRoles: z.array(z.string()).describe('A list of 2-3 relevant job roles based on field of study.'),
  technicalSkills: z.array(z.string()).describe('A short list of basic technical skills to explore.'),
  softSkills: z.array(z.string()).describe('A short list of essential soft skills.'),
  toolsAndPlatforms: z.array(z.string()).describe('A few common tools or platforms used in these roles.'),
  courseSuggestions: z.array(z.string()).describe('1-2 general course titles or types of courses.'),
  beginnerProjectIdea: z.string().describe('A simple beginner project idea.'),
});
export type CareerPathOutput = z.infer<typeof CareerPathOutputSchema>;

export async function generateCareerPath(input: CareerPathInput): Promise<CareerPathOutput> {
  // TODO: In the future, differentiate between free and premium report generation.
  // For premium, a different prompt and possibly a different model/configuration would be used.
  return generateFreeReportFlow(input);
}

// This prompt is for the "Free Report"
const freeReportPrompt = ai.definePrompt({
  name: 'freeCareerPathGeneratorPrompt',
  input: {schema: CareerPathInputSchema},
  output: {schema: CareerPathOutputSchema},
  prompt: `You are a career counselor providing a brief, free career summary for a Nigerian student/recent graduate.
User Details:
- Full Name: {{{fullName}}}
- Email: {{{email}}}
- University: {{{university}}}
- Field of Study: {{{fieldOfStudy}}}
{{#if currentSkills}}- Current Skills: {{{currentSkills}}}{{/if}}
{{#if desiredCareerPath}}- Desired Career Path: {{{desiredCareerPath}}}{{/if}}
- Learning Preference: {{{learningPreference}}}

Based on their field of study primarily, provide a concise summary (2-3 paragraphs total for the entire output combined).
Focus on:
- 2-3 potential job roles.
- A few basic technical skills.
- A few essential soft skills.
- 1-2 common tools/platforms.
- 1-2 general course suggestions (just titles or types).
- A very simple beginner project idea.

Keep the information high-level and introductory. This is a free teaser.
Example for Field of Study "Economics":
Job Roles:
- Data Analyst (Entry Level)
- Junior Financial Consultant
Technical Skills:
- Basic Excel
- Introduction to SQL
Soft Skills:
- Analytical Thinking
- Communication
Tools/Platforms:
- Microsoft Excel
- Google Sheets
Course Suggestions:
- Introduction to Data Analysis
- Economics 101
Beginner Project Idea: Analyze public data on local market prices for a common commodity.
---
Now, generate for the provided user:
`,
});

const generateFreeReportFlow = ai.defineFlow(
  {
    name: 'generateFreeReportFlow',
    inputSchema: CareerPathInputSchema,
    outputSchema: CareerPathOutputSchema,
  },
  async input => {
    const {output} = await freeReportPrompt(input);
    // For a free report, we might want to ensure the output is concise.
    // The schema description guides the LLM, but additional processing could happen here if needed.
    return output!;
  }
);

    