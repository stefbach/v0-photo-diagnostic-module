'use client'

import { useEffect, useState } from 'react'

export default function ConsultationsPage() {
  const [mockData, setMockData] = useState({
    consultations: [],
    loading: true
  })

  useEffect(() => {
    // Simulation de chargement de données
    setTimeout(() => {
      setMockData({
        consultations: [
          {
            id: '1',
            date: '2024-01-15',
            status: 'Terminée',
            type: 'Analyse photo',
            result: 'Dermatite de contact probable'
          },
          {
            id: '2', 
            date: '2024-01-10',
            status: 'En cours',
            type: 'Consultation initiale',
            result: 'En attente d\'analyse'
          }
        ],
        loading: false
      })
    }, 1000)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Banner - Confirmation de redirection */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="text-green-600 text-sm mr-2">✅</div>
            <p className="text-green-800 font-medium">
              Connexion réussie ! Bienvenue dans votre espace patient.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Consultations</h1>
              <p className="text-gray-600 mt-1">Espace patient - Diagnostic dermatologique IA</p>
            </div>
            <div className="flex gap-4">
              <a 
                href="/test-api" 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                🧪 Test API
              </a>
              <a 
                href="/auth/login" 
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                ← Déconnexion
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {mockData.loading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Chargement des consultations...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900">Total Consultations</h3>
                <p className="text-3xl font-bold text-blue-600">{mockData.consultations.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900">En cours</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {mockData.consultations.filter(c => c.status === 'En cours').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900">Terminées</h3>
                <p className="text-3xl font-bold text-green-600">
                  {mockData.consultations.filter(c => c.status === 'Terminée').length}
                </p>
              </div>
            </div>

            {/* Consultations List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Historique des Consultations</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {mockData.consultations.map((consultation) => (
                  <div key={consultation.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {consultation.type}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(consultation.date).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {consultation.result}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          consultation.status === 'Terminée' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {consultation.status}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Voir détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* New Consultation Button */}
            <div className="mt-8 text-center">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                📸 Nouvelle Consultation Photo
              </button>
            </div>
          </>
        )}

        {/* API Access Card */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🔌 Accès API Direct</h3>
          <p className="text-gray-700 mb-4">
            Accédez directement aux APIs de diagnostic sans authentification (mode développement).
          </p>
          <div className="flex gap-4">
            <a 
              href="/test-api" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Interface de Test
            </a>
            <button 
              onClick={() => {
                navigator.clipboard.writeText('curl http://localhost:3000/api/simple-photo-analysis -X POST -H "Content-Type: application/json" -d \'{"photo_urls":["https://example.com/image.jpg"]}\'')
                alert('Commande curl copiée !')
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Copier Curl
            </button>
          </div>
        </div>

        {/* Navigation et tests */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🧭 Navigation</h3>
            <div className="space-y-3">
              <a 
                href="/auth/login" 
                className="block text-blue-600 hover:text-blue-800"
              >
                ← Retour à la connexion
              </a>
              <a 
                href="/dashboard/medical" 
                className="block text-blue-600 hover:text-blue-800"
              >
                🏥 Dashboard Médical (si vous êtes docteur)
              </a>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🧪 Tests</h3>
            <div className="space-y-2">
              <button 
                onClick={() => alert('Test redirection OK ✅')}
                className="w-full bg-green-100 text-green-800 px-3 py-2 rounded hover:bg-green-200"
              >
                Tester Alert
              </button>
              <button 
                onClick={() => window.location.href = '/auth/login'}
                className="w-full bg-blue-100 text-blue-800 px-3 py-2 rounded hover:bg-blue-200"
              >
                Test Redirection Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
