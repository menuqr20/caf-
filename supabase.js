import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

export const NOME_CAF = import.meta.env.VITE_NOME_CAF || 'il nostro CAF'
