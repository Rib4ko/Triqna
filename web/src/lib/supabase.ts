import { createClient } from '@supabase/supabase-js';

// Use placeholder credentials during Next.js static build/prerender to prevent instantiation crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (
  supabaseUrl === 'https://placeholder-project.supabase.co' || 
  supabaseAnonKey === 'placeholder-anon-key'
) {
  console.warn(
    'Supabase warning: Running with placeholder credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local for database features.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
