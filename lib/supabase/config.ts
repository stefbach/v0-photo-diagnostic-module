// lib/supabase/config.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './types'

// Client pour les composants côté client
export const createClient = () => {
  return createClientComponentClient<Database>()
}
