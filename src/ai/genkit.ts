
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// Removed: import {groq} from '@genkit-ai/groq'; 

export const ai = genkit({
  plugins: [
    googleAI(), 
    // Removed: groq()      
  ],
  // Default model will be Gemini, used by flows unless overridden
  model: 'googleai/gemini-2.0-flash', 
});
