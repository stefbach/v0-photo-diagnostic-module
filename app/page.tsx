export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-lg">
        
        <div className="text-center">
          <div className="text-6xl mb-4">🩺</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tibok</h1>
          <p className="text-gray-600">Diagnostic dermatologique IA</p>
        </div>

        <div className="space-y-4">
          
            href="/auth/login"
            className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
          >
            🔐 Se connecter
          </a>
          
          
            href="/auth/sign-up"
            className="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 font-medium"
          >
            📝 Créer un compte
          </a>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Version développement</p>
        </div>
      </div>
    </div>
  )
}
