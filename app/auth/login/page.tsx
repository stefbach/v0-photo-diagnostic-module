'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('=== DÉBUT CONNEXION ===')
      console.log('Email:', email, 'Password:', password)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('=== RÉPONSE AUTH ===')
      console.log('data:', data)
      console.log('error:', error)

      if (error) {
        console.log('❌ ERREUR AUTH:', error.message)
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        console.log('✅ UTILISATEUR CONNECTÉ')
        console.log('User ID:', data.user.id)
        
        console.log('=== RECHERCHE PROFIL ===')
        const { data: profile } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', data.user.id)
          .single()

        console.log('Profile récupéré:', profile)
        
        // Test de redirection immédiate
        if (profile?.user_type === 'doctor' || profile?.user_type === 'admin') {
          console.log('🏥 REDIRECTION → DASHBOARD MÉDICAL')
          alert('Redirection vers dashboard médical...')
          window.location.href = '/dashboard/medical'
        } else {
          console.log('👤 REDIRECTION → CONSULTATIONS') 
          alert('Redirection vers consultations...')
          window.location.href = '/consultations'
        }
        
      } else {
        console.log('❌ PAS D\'UTILISATEUR DANS LA RÉPONSE')
        setError('Erreur: pas d\'utilisateur retourné')
      }
      
    } catch (error) {
      console.error('❌ ERREUR COMPLÈTE:', error)
      setError('Erreur de connexion: ' + error.message)
    }
    
    setLoading(false)
    console.log('=== FIN CONNEXION ===')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à Tibok (TEST)
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Version debug avec logs détaillés
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              <strong>Erreur:</strong> {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="patient@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="test123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter (DEBUG)'}
            </button>
          </div>

          {/* Boutons de test rapide */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('patient@test.com')
                setPassword('test123')
              }}
              className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
            >
              Test Patient
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('doctor@test.com')
                setPassword('test123')
              }}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              Test Docteur
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-600">
              Ouvrez la console (F12) pour voir les logs détaillés
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
