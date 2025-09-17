'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    userType: 'patient' as 'patient' | 'doctor'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation basique
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    try {
      // 1. Créer le compte utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_type: formData.userType,
          }
        }
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // 2. Créer le profil utilisateur dans la table users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            user_type: formData.userType,
          })

        if (profileError) {
          console.error('Erreur création profil:', profileError)
          // Ne pas bloquer si la création du profil échoue
        }

        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/login?message=Compte créé avec succès')
        }, 2000)
      }
    } catch (error) {
      console.error('SignUp error:', error)
      setError('Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-green-600 text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-green-800 mb-2">
              Compte créé avec succès !
            </h2>
            <p className="text-green-700 text-sm">
              Vérifiez votre email pour confirmer votre compte.
              Redirection vers la connexion...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créer un compte Tibok
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accédez au diagnostic dermatologique IA
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Nom complet
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Votre nom complet"
              value={formData.fullName}
              onChange={handleInputChange}
            />
          </div>

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
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
              Type de compte
            </label>
            <select
              id="userType"
              name="userType"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.userType}
              onChange={handleInputChange}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Médecin</option>
            </select>
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
              placeholder="Mot de passe (min. 6 caractères)"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirmez votre mot de passe"
              value={formData.confirmPassword}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>

          <div className="text-center">
            <a 
              href="/auth/login"
              className="text-blue-600 hover:text-blue-500"
            >
              Déjà un compte ? Se connecter
            </a>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="text-sm font-medium text-blue-800">Création compte Supabase</h3>
          <p className="text-xs text-blue-700 mt-1">
            Votre compte sera créé dans Supabase. Un email de confirmation sera envoyé.
          </p>
        </div>
      </div>
    </div>
  )
}
