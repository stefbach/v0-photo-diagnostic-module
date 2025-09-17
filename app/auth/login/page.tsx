export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h1 className="text-4xl font-bold text-center text-red-600 mb-8">
            🔗 TEST LIENS HTML
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Test sans JavaScript - avec des liens simples
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Lien simple vers consultations */}
          <a
            href="/consultations"
            className="block w-full bg-red-600 text-white py-4 px-4 rounded-lg text-center text-lg font-bold hover:bg-red-700"
          >
            🚀 LIEN VERS /consultations
          </a>
          
          {/* Lien vers Google pour tester */}
          <a
            href="https://google.com"
            target="_blank"
            className="block w-full bg-blue-600 text-white py-4 px-4 rounded-lg text-center text-lg font-bold hover:bg-blue-700"
          >
            🌐 LIEN VERS GOOGLE
          </a>
          
          {/* Lien vers la page d'accueil */}
          <a
            href="/"
            className="block w-full bg-green-600 text-white py-4 px-4 rounded-lg text-center text-lg font-bold hover:bg-green-700"
          >
            🏠 LIEN VERS ACCUEIL
          </a>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">TEST SIMPLE :</h3>
          <p className="text-sm text-yellow-700">
            Si ces liens ne fonctionnent pas, c'est un problème de routing Next.js, pas de JavaScript.
          </p>
        </div>

        {/* Info sur l'URL actuelle */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Vous êtes actuellement sur : /auth/login
          </p>
        </div>
      </div>
    </div>
  )
}
