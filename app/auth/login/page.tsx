'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.clear()
    console.log('🔥 DÉBUT TEST REDIRECTION')
    
    // Test immédiat sans aucune logique
    alert('Test 1: Formulaire soumis !')
    
    setTimeout(() => {
      alert('Test 2: Redirection dans 1 seconde...')
      console.log('🚀 REDIRECTION VERS CONSULTATIONS')
      window.location.href = '/consultations'
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-red-600">
            🔧 TEST REDIRECTION SIMPLE
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <input
              type="email"
              placeholder="Tapez n'importe quoi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Tapez n'importe quoi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md text-lg font-bold"
          >
            🚀 TEST REDIRECTION
          </button>
        </form>

        {/* Boutons de test direct */}
        <div className="space-y-2">
          <button
            onClick={() => {
              console.log('🔥 TEST DIRECT')
              alert('Test direct: Redirection immédiate!')
              window.location.href = '/consultations'
            }}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md"
          >
            🔥 TEST DIRECT (sans formulaire)
          </button>
          
          <button
            onClick={() => {
              console.log('🔥 TEST AVEC HREF')
              window.location.href = 'https://google.com'
            }}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md"
          >
            🌐 TEST REDIRECTION GOOGLE
          </button>
        </div>
      </div>
    </div>
  )
}
