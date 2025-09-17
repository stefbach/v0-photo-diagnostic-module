// lib/supabase/server.ts
// Version serveur simplifiée sans dépendances Supabase

export const createServerSupabaseClient = () => {
  return {
    auth: {
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
    }),
    storage: {
      from: () => ({
        createSignedUrl: () => ({ data: null, error: null })
      })
    }
  }
}
