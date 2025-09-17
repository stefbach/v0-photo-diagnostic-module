export default function ConsultationsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-green-600 text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            Page Consultations
          </h1>
          <p className="text-green-700">
            Redirection réussie ! Vous êtes connecté en tant que <strong>patient</strong>.
          </p>
          <div className="mt-4">
            <a 
              href="/auth/login"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              ← Retour à la connexion
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
