import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '[PRESENT]' : '[MISSING]',
    allEnvVars: import.meta.env,
  })
  throw new Error(
    `Missing Supabase environment variables. ` +
    `VITE_SUPABASE_URL: ${supabaseUrl ? 'present' : 'MISSING'}, ` +
    `VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'present' : 'MISSING'}`
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})
