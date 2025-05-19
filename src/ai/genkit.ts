
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {groq} from '@genkit-ai/groq'; // Import the Groq plugin removed

export const ai = genkit({
  plugins: [
    googleAI(), // For Gemini (free reports and now premium reports as fallback)
    // groq()      // Groq plugin removed
  ],
  // Default model will be Gemini, used by flows unless overridden
  model: 'googleai/gemini-2.0-flash', 
});
