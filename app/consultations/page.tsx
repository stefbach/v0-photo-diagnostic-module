export default function ConsultationsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div className="bg-green-100 border border-green-300 rounded-lg p-8">
          <div className="text-green-600 text-8xl mb-4">🎯</div>
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            ÇA MARCHE !
          </h1>
          <p className="text-2xl text-green-700 mb-4">
            VOUS ÊTES SUR /consultations
          </p>
          <p className="text-green-600 mb-6 text-lg">
            ✅ La navigation fonctionne parfaitement !
          </p>
          <div className="space-y-3">
            <a 
              href="/auth/login"
              className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              ← Retour au Login
            </a>
            <a 
              href="/"
              className="block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              🏠 Accueil
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
