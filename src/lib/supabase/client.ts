import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your actual Supabase URL and Anon Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined. Please set NEXT_PUBLIC_SUPABASE_URL in your .env file.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key is not defined. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
