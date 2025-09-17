export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-4xl mb-4">🩺</h1>
          <h2 className="text-2xl font-bold mb-2">Tibok</h2>
          <p className="text-gray-600 mb-8">Diagnostic dermatologique IA</p>
          
          <div className="space-y-4">
            
              href="/auth/login"
              className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700"
            >
              Se connecter
            </a>
            
            
              href="/auth/sign-up"
              className="block w-full bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700"
            >
              Créer un compte
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
