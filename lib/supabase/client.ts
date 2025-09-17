// lib/supabase/client.ts
// Version client simplifiée sans dépendances Supabase

export const createClient = () => {
  return {
    auth: {
      signUp: async (credentials: any) => {
        console.log('Mock signUp called with:', credentials.email)
        // Simulation d'un succès
        return {
          data: { 
            user: { 
              id: 'mock-user-id', 
              email: credentials.email 
            } 
          },
          error: null
        }
      },
      signInWithPassword: async (credentials: any) => {
        console.log('Mock signIn called with:', credentials.email)
        // Simulation d'un succès
        return {
          data: { 
            user: { 
              id: 'mock-user-id', 
              email: credentials.email 
            },
            session: { access_token: 'mock-token' }
          },
          error: null
        }
      },
      signOut: async () => {
        console.log('Mock signOut called')
        return { error: null }
      },
      getUser: async () => {
        return {
          data: { user: null },
          error: null
        }
      }
    },
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            console.log(`Mock DB query: SELECT ${columns} FROM ${table} WHERE ${column} = ${value}`)
            // Simulation de données utilisateur
            if (table === 'users') {
              return { 
                data: { 
                  user_type: 'patient' // ou 'doctor' selon vos tests
                }, 
                error: null 
              }
            }
            return { data: null, error: null }
          }
        })
      }),
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            console.log(`Mock DB insert into ${table}:`, data)
            return { data: data, error: null }
          }
        })
      })
    })
  }
}
