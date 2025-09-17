// lib/supabase/client.ts
const TEST_USERS = [
  { email: 'patient@test.com', password: 'test123', type: 'patient' },
  { email: 'doctor@test.com', password: 'test123', type: 'doctor' },
  { email: 'admin@test.com', password: 'test123', type: 'admin' }
]

export const createClient = () => {
  return {
    auth: {
      signInWithPassword: async ({ email, password }: any) => {
        console.log('Tentative de connexion:', email, password)
        
        const user = TEST_USERS.find(u => u.email === email && u.password === password)
        
        if (user) {
          console.log('Utilisateur trouvé:', user)
          return {
            data: { 
              user: { 
                id: `mock-${user.type}-id`, 
                email: user.email 
              },
              session: { access_token: 'mock-token' }
            },
            error: null
          }
        } else {
          console.log('Utilisateur non trouvé')
          return {
            data: { user: null, session: null },
            error: { message: 'Email ou mot de passe incorrect' }
          }
        }
      },
      
      signUp: async ({ email, password, options }: any) => {
        console.log('Inscription pour:', email, options)
        return {
          data: { 
            user: { 
              id: 'new-user-id', 
              email: email 
            } 
          },
          error: null
        }
      },
      
      getUser: async () => ({ data: { user: null }, error: null })
    },
    
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            console.log(`DB Query: SELECT ${columns} FROM ${table} WHERE ${column} = ${value}`)
            
            // Retourner le type d'utilisateur selon l'ID
            if (table === 'users') {
              if (value.includes('doctor')) {
                console.log('Retournant type: doctor')
                return { data: { user_type: 'doctor' }, error: null }
              } else if (value.includes('admin')) {
                console.log('Retournant type: admin')
                return { data: { user_type: 'admin' }, error: null }
              } else {
                console.log('Retournant type: patient')
                return { data: { user_type: 'patient' }, error: null }
              }
            }
            
            return { data: null, error: null }
          }
        })
      }),
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            console.log(`DB Insert into ${table}:`, data)
            return { data: data, error: null }
          }
        })
      })
    })
  }
}
