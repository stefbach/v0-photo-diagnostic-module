import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

// Schema pour l'analyse photo (inchangé)
const PhotoAnalysisSchema = z.object({
  lesions: z.array(
    z.object({
      location: z.string().describe("Localisation anatomique de la lésion"),
      morphology: z.string().describe("Description morphologique de la lésion"),
      size_mm: z.number().optional().describe("Taille approximative en millimètres"),
      borders: z.string().optional().describe("Description des bordures"),
      features: z.array(z.string()).describe("Caractéristiques particulières observées"),
    }),
  ),
  diagnostic_diff: z.array(z.string()).max(3).describe("Diagnostic différentiel (maximum 3 hypothèses)"),
  red_flags: z.array(z.string()).describe("Signaux d'alarme identifiés"),
  suggested_tests: z.array(z.string()).describe("Examens complémentaires suggérés"),
  orientation: z.string().describe("Orientation thérapeutique (urgent, non urgent, suivi)"),
})

// Auth bypass function
async function authenticateRequest(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  
  if (apiKey === process.env.TIBOK_API_KEY) {
    return { user: { id: 'system' }, isService: true, error: null }
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, isService: false, error }
}

const DERMATOLOGY_SYSTEM_PROMPT = `Tu es un dermatologue expert avec 20 ans d'expérience clinique. 

Analyse les images cliniques fournies et produis un rapport JSON structuré selon le schéma demandé.

RÈGLES IMPORTANTES :
- Ne jamais poser de diagnostic certain, seulement des hypothèses différentielles
- Identifier tous les signaux d'alarme potentiels
- Être précis dans les descriptions morphologiques
- Limiter le diagnostic différentiel à 3 hypothèses maximum
- Utiliser la terminologie médicale française appropriée
- Toujours recommander une consultation médicale pour confirmation`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authentification avec bypass
    const auth = await authenticateRequest(request)
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { consultation_id, photo_urls, context } = body

    if (!photo_urls || !Array.isArray(photo_urls)) {
      return NextResponse.json({ error: "photo_urls requis" }, { status: 400 })
    }

    // Si c'est un service, skip la vérification de consultation
    let consultation = null
    if (!auth.isService) {
      const { data: consultationData, error: consultationError } = await supabase
        .from("consultations")
        .select("*")
        .eq("id", consultation_id)
        .single()

      if (consultationError || !consultationData) {
        return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 })
      }

      if (consultationData.patient_id !== auth.user.id && consultationData.doctor_id !== auth.user.id) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
      }
      consultation = consultationData
    }

    // Préparation du contexte (utilise le contexte fourni si service)
    const analysisContext = context || {
      patient_age: consultation?.patient_age,
      patient_gender: consultation?.patient_gender,
      chief_complaint: consultation?.chief_complaint,
      symptoms: consultation?.symptoms,
      medical_history: consultation?.medical_history,
      current_medications: consultation?.current_medications,
    }

    const startTime = Date.now()

    // Appel à l'API OpenAI
    const { object: report } = await generateObject({
      model: openai("gpt-4o"),
      schema: PhotoAnalysisSchema,
      system: DERMATOLOGY_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Contexte clinique :
Patient : ${analysisContext.patient_age || 'N/A'} ans, ${analysisContext.patient_gender || 'N/A'}
Motif : ${analysisContext.chief_complaint || "Non spécifié"}
Symptômes : ${Array.isArray(analysisContext.symptoms) ? analysisContext.symptoms.join(", ") : "Non spécifiés"}
Antécédents : ${Array.isArray(analysisContext.medical_history) ? analysisContext.medical_history.join(", ") : "Non spécifiés"}

Analyse les images suivantes :`,
            },
            ...photo_urls.map((url: string) => ({
              type: "image" as const,
              image: url,
            })),
          ],
        },
      ],
      temperature: 0.2,
      maxTokens: 1200,
    })

    const latency = Date.now() - startTime
    const estimatedCost = photo_urls.length * 0.01 + 0.005

    // Sauvegarde seulement si pas un service
    let savedReport = null
    if (!auth.isService && consultation_id) {
      const { data } = await supabase
        .from("ai_photo_reports")
        .insert({
          consultation_id,
          model: "gpt-4o",
          prompt_version: "derm-v1",
          input_photos: photo_urls,
          report,
          latency_ms: latency,
          cost_usd: estimatedCost,
        })
        .select()
        .single()
      
      savedReport = data
    }

    return NextResponse.json({
      photo_report_id: savedReport?.id || null,
      report,
      metadata: {
        latency_ms: latency,
        cost_usd: estimatedCost,
        model: "gpt-4o",
        prompt_version: "derm-v1",
        images_analyzed: photo_urls.length,
        service_mode: auth.isService,
      },
    })
  } catch (error) {
    console.error("Photo diagnosis error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
