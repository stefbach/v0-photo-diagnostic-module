'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [status, setStatus] = useState('')

  const testRedirection = () => {
    setStatus('🔥 Test en cours...')
    
    setTimeout(() => {
      setStatus('🚀 Redirection dans 2 secondes...')
      
      setTimeout(() => {
        setStatus('⏳ Redirection maintenant!')
        window.location.href = '/consultations'
      }, 2000)
    }, 1000)
  }

  const testGoogle = () => {
    setStatus('🌐 Test redirection Google...')
    setTimeout(() => {
      window.location.href = 'https://google.com'
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-red-600">
            🔧 TEST REDIRECTION VISUEL
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sans dépendre de la console
          </p>
        </div>
        
        {/* Status display */}
        {status && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
            <p className="text-lg font-medium text-blue-800">{status}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={testRedirection}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-md text-lg font-bold hover:bg-red-700"
          >
            🚀 TEST REDIRECTION /consultations
          </button>
          
          <button
            onClick={testGoogle}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md text-lg font-bold hover:bg-blue-700"
          >
            🌐 TEST REDIRECTION Google
          </button>
          
          <button
            onClick={() => {
              setStatus('📍 Test: Vous êtes sur la page login')
              setTimeout(() => setStatus(''), 3000)
            }}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md text-lg font-bold hover:bg-green-700"
          >
            📍 TEST: Affichage de statut
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">Instructions :</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Cliquez sur "📍 TEST: Affichage" → Doit afficher un message bleu</li>
            <li>2. Cliquez sur "🌐 TEST Google" → Doit aller sur Google</li>
            <li>3. Revenez ici et cliquez sur "🚀 TEST /consultations"</li>
          </ol>
        </div>

        {/* Debug info */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h3 className="font-bold text-gray-800 mb-2">Info debug :</h3>
          <p className="text-xs text-gray-600">
            URL actuelle : {typeof window !== 'undefined' ? window.location.href : 'Chargement...'}
          </p>
          <p className="text-xs text-gray-600">
            JavaScript fonctionne : ✅ (sinon vous ne verriez pas cette page)
          </p>
        </div>
      </div>
    </div>
  )
}
