export default function ConsultationsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div className="bg-green-100 border border-green-300 rounded-lg p-8">
          <div className="text-green-600 text-8xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            ÇA MARCHE !
          </h1>
          <p className="text-2xl text-green-700 mb-6">
            REDIRECTION RÉUSSIE ✅
          </p>
          <div className="bg-green-200 p-4 rounded mb-6">
            <p className="text-green-800 font-bold">
              Vous êtes sur /consultations
            </p>
            <p className="text-green-600">
              La redirection fonctionne parfaitement !
            </p>
          </div>
          <a 
            href="/auth/login"
            className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-lg"
          >
            ← Retour au login
          </a>
        </div>
      </div>
    </div>
  )
}
