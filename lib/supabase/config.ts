// lib/supabase/config.ts
// Version simplifiée sans dépendances Supabase

export const createClient = () => {
  return {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
        // Mode simulation pour développement
        console.log('Simulation login:', { email, password })
        return {
          data: { user: { id: 'mock-user', email } },
          error: null
        }
      },
      signUp: async (options: any) => {
        console.log('Simulation signup:', options)
        return {
          data: { user: { id: 'mock-user', email: options.email } },
          error: null
        }
      },
      getUser: async () => {
        return {
          data: { user: null },
          error: null
        }
      }
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: null, error: null })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => ({ data: null, error: null })
        })
      })
    })
  }
}
