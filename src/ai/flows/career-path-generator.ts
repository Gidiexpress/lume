
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
  email: z.string().email().optional().describe("The user's email address. (Optional for free report generation input, but useful for context if available)"),
  university: z.string().optional().describe("The user's university or institution. (Optional for free report generation input)"),
  fieldOfStudy: z.string().describe("The user's field of study."),
  currentSkills: z.string().optional().describe("The user's current skills. (Optional for free report generation input)"),
  desiredCareerPath: z.string().optional().describe("The user's desired career path. (Optional for free report generation input)"),
  learningPreference: z.string().optional().describe("The user's preferred learning style (e.g., Online, Hybrid, In-person)."),
  additionalContext: z.string().optional().describe("Any additional context or specific questions the user has."),
});
export type CareerPathInput = z.infer<typeof CareerPathInputSchema>;

// New structured output schema for the Free Report
const SingleFreeCareerPathSchema = z.object({
  pathName: z.string().describe("The name of the suggested career path."),
  overview: z.string().describe("A 2-3 sentence overview of what the path involves."),
  reasonItFits: z.string().describe("One reason this path fits the user's background."),
  typicalResponsibilities: z.array(z.string()).min(3).max(5).describe("3-5 typical responsibilities or day-to-day tasks."),
  essentialSkillsToStart: z.array(z.string()).min(3).max(4).describe("3-4 beginner-friendly skills the user should start learning."),
  learningResources: z.array(z.object({
    title: z.string().describe("Title of the learning resource."),
    platform: z.string().describe("Platform where the resource can be found (e.g., YouTube, Coursera)."),
    link: z.string().optional().describe("A direct URL to the resource, a search query URL, or a search term suggestion. e.g., https://www.coursera.org or 'Search: Intro to UX on YouTube'."),
  })).min(1).max(2).describe("1-2 beginner learning resources for this path.")
});

const CareerPathOutputSchema = z.object({
  suggestedCareerPaths: z.array(SingleFreeCareerPathSchema).min(3).max(3).describe("Exactly 3 suggested career paths with details."),
  encouragementAndAdvice: z.string().describe("A short paragraph offering career encouragement and a next-step mindset, mentioning the premium report.")
});
export type CareerPathOutput = z.infer<typeof CareerPathOutputSchema>;


export async function generateCareerPath(input: CareerPathInput): Promise<CareerPathOutput> {
  return generateFreeReportFlow(input);
}

// Updated prompt for the "Free Report"
const freeReportPrompt = ai.definePrompt({
  name: 'freeCareerPathGeneratorPrompt',
  input: {schema: CareerPathInputSchema},
  output: {schema: CareerPathOutputSchema},
  prompt: `You are a career development expert helping university students and recent graduates in Nigeria explore meaningful career options based on their course of study.

The user has entered their field of study. Your task is to generate a concise, helpful, and visually well-structured **free career guidance report** that includes real value — not just surface-level suggestions. Keep the tone friendly, motivational, and professional.

💡 Focus on:
- Clear recommendations
- Easy-to-understand language
- Visually structured sections
- Enough actionable insight to be genuinely useful

---

1. 🎯 **Suggested Career Paths**
- Recommend 3 career paths that align with the user’s course of study.
- For each path, write:
  - A 2–3 sentence overview of what it involves.
  - One reason it fits their background.

2. 🧠 **What You’ll Be Doing**
- For each path, list 3–5 typical responsibilities or day-to-day tasks in bullet points.

3. 🛠️ **Essential Skills to Start**
- For each path, list 3–4 beginner-friendly skills the user should start learning.
- Keep it practical and relevant.

4. 🚀 **How to Start Learning**
- Suggest 1–2 beginner resources for each path (free courses, YouTube videos, or platforms).
- Format: [Course Title] – Platform – Link
- For the 'Link' field: Provide a direct URL to the resource if available and stable (e.g., www.coursera.org/learn/python). If not, provide a general platform link (e.g., www.youtube.com) or a good search query string (e.g., "Search: Introduction to UX Design on YouTube"). The schema for 'link' accepts any string.

5. 💬 **Encouragement & Advice**
- End with a short paragraph offering career encouragement and a next-step mindset.
- Mention that a more detailed premium report is available with full roadmaps, certifications, salary insights, and project plans.

---

📌 PERSONALIZATION:
- Use “you” or the user’s first name ({{fullName}}) in the writing.
- User input available:
  - Name: {{fullName}}
  - Field of Study: {{fieldOfStudy}}
  {{#if learningPreference}}- Preferred Learning Mode: {{{learningPreference}}}{{/if}}
  {{#if additionalContext}}- Additional Notes (if any): {{{additionalContext}}}{{/if}}

---

📝 Output Format:
- Use bold headers for each section as suggested by the Zod schema descriptions (e.g., pathName, overview).
- Use short paragraphs and bullet points for easy reading.
- Be warm, clear, and encouraging — speak to someone early in their career journey.
- Ensure the output strictly conforms to the defined Zod schema, especially the array structures and counts for suggestedCareerPaths, typicalResponsibilities, essentialSkillsToStart, and learningResources.

---

This is the free version. It must offer real value and inspire confidence in the AI system, while naturally pointing toward the richer premium version available.
Generate the report according to the output schema. Ensure each of the 3 suggested paths contains all requested sub-sections (overview, reasonItFits, typicalResponsibilities, essentialSkillsToStart, learningResources).
`,
});

const generateFreeReportFlow = ai.defineFlow(
  {
    name: 'generateFreeReportFlow',
    inputSchema: CareerPathInputSchema,
    outputSchema: CareerPathOutputSchema,
  },
  async input => {
    // The input already conforms to CareerPathInputSchema.
    // The freeReportPrompt's input schema is also CareerPathInputSchema.
    // Handlebars template will pick the fields it needs (fullName, fieldOfStudy, etc.).
    const {output} = await freeReportPrompt(input);
    if (!output) {
      throw new Error("Free report generation failed to produce output. The AI model might not have returned data conforming to the expected schema.");
    }
    return output;
  }
);
    
