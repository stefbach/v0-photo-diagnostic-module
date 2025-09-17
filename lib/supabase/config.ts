// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './types'

export const createClient = () => createClientComponentClient<Database>()

// lib/supabase/server.ts  
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './types'

export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ 
    cookies: () => cookieStore 
  })
}

// Alternative pour les route handlers
export const createRouteHandlerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ 
    cookies: () => cookieStore 
  })
}
