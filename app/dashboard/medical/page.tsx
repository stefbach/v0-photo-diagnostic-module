export default function MedicalDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-100 border-b-4 border-blue-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center">
            <div className="text-blue-500 text-2xl mr-3">✅</div>
            <div>
              <h2 className="text-lg font-bold text-blue-800">Connexion réussie !</h2>
              <p className="text-blue-700">Bienvenue dans le tableau de bord médical</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏥</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Médical</h1>
            <p className="text-gray-600">Interface docteur/administrateur</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-green-800">Patients</div>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-blue-800">Consultations</div>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-yellow-600">0</div>
              <div className="text-yellow-800">En attente</div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <div className="text-purple-800">Analysées</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 text-lg font-medium">
              👥 Gérer les patients
            </button>
            <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 text-lg font-medium">
              📋 Consultations en attente
            </button>
            <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 text-lg font-medium">
              📊 Statistiques IA
            </button>
            <button className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 text-lg font-medium">
              ⚙️ Configuration
            </button>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-between">
              <a href="/auth/login" className="text-gray-600 hover:text-gray-800">
                ← Retour à la connexion
              </a>
              <a href="/consultations" className="text-blue-600 hover:text-blue-800">
                👤 Vue patient →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
