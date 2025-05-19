
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {groq} from '@genkit-ai/groq'; // Removed Groq plugin import

export const ai = genkit({
  plugins: [
    googleAI(), // For Gemini (free reports and now premium reports fallback)
    // groq()      // Removed Groq plugin
  ],
  // Default model will be Gemini, used by flows unless overridden
  model: 'googleai/gemini-2.0-flash', 
});
