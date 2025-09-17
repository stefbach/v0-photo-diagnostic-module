export default function ConsultationsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-green-100 border-b-4 border-green-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center">
            <div className="text-green-500 text-2xl mr-3">✅</div>
            <div>
              <h2 className="text-lg font-bold text-green-800">Connexion réussie !</h2>
              <p className="text-green-700">Bienvenue dans votre espace patient</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👤</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Espace Patient</h1>
            <p className="text-gray-600">Diagnostic dermatologique IA</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-blue-800">Consultations</div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-green-800">Analyses</div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <div className="text-purple-800">Rapports</div>
            </div>
          </div>

          <div className="space-y-4">
            <button className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 text-lg font-medium">
              📸 Nouvelle consultation photo
            </button>
            <button className="w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 text-lg font-medium">
              📋 Voir mes consultations
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between">
              <a href="/auth/login" className="text-gray-600 hover:text-gray-800">
                ← Retour à la connexion
              </a>
              <a href="/" className="text-blue-600 hover:text-blue-800">
                🏠 Accueil →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
