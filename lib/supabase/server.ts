// lib/supabase/server.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './types'

// Client pour les route handlers (API routes)
export const createServerClient = () => {
  const cookieStore = cookies()
  return createRouteHandlerClient<Database>({ 
    cookies: () => cookieStore 
  })
}
