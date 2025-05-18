// 'use server'
'use server';
/**
 * @fileOverview Generates a tailored career path based on the user's field of study and career interests.
 *
 * - generateCareerPath - A function that generates the career path.
 * - CareerPathInput - The input type for the generateCareerPath function.
 * - CareerPathOutput - The return type for the generateCareerPath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CareerPathInputSchema = z.object({
  fieldOfStudy: z.string().describe('The user\'s field of study.'),
  careerInterests: z.string().optional().describe('The user\'s career interests.'),
});
export type CareerPathInput = z.infer<typeof CareerPathInputSchema>;

const CareerPathOutputSchema = z.object({
  jobRoles: z.array(z.string()).describe('A list of relevant job roles.'),
  technicalSkills: z.array(z.string()).describe('A list of technical skills to learn.'),
  softSkills: z.array(z.string()).describe('A list of soft skills to develop.'),
  toolsAndPlatforms: z.array(z.string()).describe('A list of tools and platforms to learn.'),
  courseSuggestions: z.array(z.string()).describe('A list of course suggestions.'),
  beginnerProjectIdea: z.string().describe('An idea for a beginner project.'),
});
export type CareerPathOutput = z.infer<typeof CareerPathOutputSchema>;

export async function generateCareerPath(input: CareerPathInput): Promise<CareerPathOutput> {
  return generateCareerPathFlow(input);
}

const prompt = ai.definePrompt({
  name: 'careerPathGeneratorPrompt',
  input: {schema: CareerPathInputSchema},
  output: {schema: CareerPathOutputSchema},
  prompt: `You are a career counselor specializing in providing tailored career guidance. Based on the user's field of study and career interests, generate a career path with relevant job roles, skills, and learning resources.

  Field of Study: {{{fieldOfStudy}}}
  Career Interests: {{{careerInterests}}}

  Output:
  - Job Roles (2-3):
  - Technical Skills:
  - Soft Skills:
  - Tools/Platforms to Learn:
  - Course Suggestions (2-3 course titles):
  - Beginner Project Idea:
  `,
});

const generateCareerPathFlow = ai.defineFlow(
  {
    name: 'generateCareerPathFlow',
    inputSchema: CareerPathInputSchema,
    outputSchema: CareerPathOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
