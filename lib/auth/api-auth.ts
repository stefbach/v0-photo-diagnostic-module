// lib/auth/api-auth.ts
import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server"

export async function authenticateRequest(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  
  // Check for API key first (for service-to-service communication)
  if (apiKey) {
    if (apiKey === process.env.TIBOK_API_KEY) {
      return {
        user: { id: 'system', role: 'service' },
        isService: true,
        error: null
      }
    }
    return { user: null, isService: false, error: 'Invalid API key' }
  }

  // Fallback to Supabase auth
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  return { user, isService: false, error }
}

// Exemple d'utilisation dans vos routes API
export async function GET(request: NextRequest, { params }: any) {
  const auth = await authenticateRequest(request)
  
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Si c'est un service, skip les vérifications de propriété
  if (auth.isService) {
    // Accès complet pour les services
  } else {
    // Vérifications normales pour les utilisateurs
  }
}
