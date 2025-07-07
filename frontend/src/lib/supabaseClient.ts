import { createClient } from '@supabase/supabase-js'

// IMPORTANT: These environment variables must be configured in your Vercel project settings.
// They should be prefixed with NEXT_PUBLIC_ to be accessible on the client-side.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 