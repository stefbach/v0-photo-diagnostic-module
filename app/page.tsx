export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-8">
          <div className="text-blue-600 text-6xl mb-4">🏠</div>
          <h1 className="text-3xl font-bold text-blue-800 mb-4">
            PAGE D'ACCUEIL
          </h1>
          <p className="text-blue-700 mb-6">
            Vous êtes sur la page d'accueil (/)
          </p>
          <div className="space-y-3">
            <a 
              href="/auth/login"
              className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              → Aller au Login
            </a>
            <a 
              href="/consultations"
              className="block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              → Aller aux Consultations
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
