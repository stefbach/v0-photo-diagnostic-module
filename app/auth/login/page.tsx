'use client'

import { useState } from 'react'

const COMPTES_TEST = {
  'patient@test.com': { password: 'test123', type: 'patient', redirect: '/consultations' },
  'doctor@test.com': { password: 'test123', type: 'doctor', redirect: '/dashboard/medical' },
  'admin@test.com': { password: 'test123', type: 'admin', redirect: '/dashboard/medical' }
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    setStatus('🔍 Vérification...')
    
    const compte = COMPTES_TEST[email as keyof typeof COMPTES_TEST]
    
    if (!compte) {
      setStatus('❌ Email inconnu')
      return
    }
    
    if (compte.password !== password) {
      setStatus('❌ Mot de passe incorrect')
      return
    }
    
    setStatus(`✅ Connexion réussie ! Redirection...`)
    
    setTimeout(() => {
      window.location.href = compte.redirect
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow">
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Connexion Tibok</h1>
          <p className="text-gray-600 mt-2">Diagnostic IA dermatologique</p>
        </div>

        {status && (
          <div className={`p-4 rounded-lg text-center font-medium ${
            status.includes('❌') ? 'bg-red-50 text-red-700' : 
            status.includes('✅') ? 'bg-green-50 text-green-700' : 
            'bg-blue-50 text-blue-700'
          }`}>
            {status}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="patient@test.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="test123"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
          >
            Se connecter
          </button>
        </form>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">🧪 Comptes de test :</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>👤 <strong>patient@test.com</strong> / test123</div>
            <div>👨‍⚕️ <strong>doctor@test.com</strong> / test123</div>
            <div>👨‍💼 <strong>admin@test.com</strong> / test123</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setEmail('patient@test.com')
              setPassword('test123')
            }}
            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('doctor@test.com')
              setPassword('test123')
            }}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Docteur
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@test.com')
              setPassword('test123')
            }}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
          >
            Admin
          </button>
        </div>

        <div className="text-center">
          <a href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  )
}
