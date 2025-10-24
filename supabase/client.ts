import { createClient } from '@supabase/supabase-js'

// The environment variables were not being picked up correctly during the Vercel build.
// Hardcoding the public anon keys directly into the client is the most reliable way
// to fix the infinite loading screen issue for this setup.
const supabaseUrl = 'https://oqaejnkfqxmjuqzrdjbt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYWVqbmtmcXhtanVxenJkamJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDYyODQsImV4cCI6MjA3Njg4MjI4NH0.lyRdNCeTb2lAen7yHNmS1wAyj-NxPFC4sumgDvP2ZpE';

if (!supabaseUrl || !supabaseKey) {
  // This check is kept just in case the keys are removed in the future.
  console.error("Supabase URL or Key is not set. Please check your supabase/client.ts file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
