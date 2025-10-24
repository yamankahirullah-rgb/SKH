import { createClient } from '@supabase/supabase-js'

// Assume Supabase URL and Key are available as environment variables in the build environment
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is not set. Please check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey)