// app/api/v1/analyze-photos/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

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
  confidence_score: z.number().min(0).max(1).describe("Score de confiance de l'analyse"),
})

const DERMATOLOGY_SYSTEM_PROMPT = `Tu es un dermatologue expert avec 20 ans d'expérience clinique.

Analyse les images cliniques fournies et produis un rapport JSON structuré.

RÈGLES IMPORTANTES :
- Ne jamais poser de diagnostic certain, seulement des hypothèses différentielles
- Identifier tous les signaux d'alarme potentiels
- Être précis dans les descriptions morphologiques
- Limiter le diagnostic différentiel à 3 hypothèses maximum
- Utiliser la terminologie médicale française appropriée
- Toujours recommander une consultation médicale pour confirmation
- Fournir un score de confiance basé sur la qualité des images`

// Authentification simple par API key
function authenticateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  return apiKey === process.env.TIBOK_API_KEY
}

export async function POST(request: NextRequest) {
  try {
    // Vérification API key
    if (!authenticateApiKey(request)) {
      return NextResponse.json({ 
        error: "API key invalide ou manquante",
        details: "Utilisez le header 'x-api-key' ou 'Authorization: Bearer YOUR_KEY'"
      }, { status: 401 })
    }

    const body = await request.json()
    const { 
      photo_urls, 
      context = {},
      options = {} 
    } = body

    // Validation des paramètres
    if (!photo_urls || !Array.isArray(photo_urls) || photo_urls.length === 0) {
      return NextResponse.json({ 
        error: "photo_urls requis (tableau d'URLs d'images)",
        example: {
          photo_urls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
          context: {
            patient_age: 35,
            patient_gender: "F",
            symptoms: ["rougeur", "démangeaisons"],
            duration: "2 semaines"
          }
        }
      }, { status: 400 })
    }

    if (photo_urls.length > 5) {
      return NextResponse.json({ 
        error: "Maximum 5 images par analyse" 
      }, { status: 400 })
    }

    const startTime = Date.now()

    // Préparation du contexte clinique
    const contextText = `
Contexte clinique :
${context.patient_age ? `Âge: ${context.patient_age} ans` : ''}
${context.patient_gender ? `Genre: ${context.patient_gender}` : ''}
${context.chief_complaint ? `Motif: ${context.chief_complaint}` : ''}
${context.symptoms ? `Symptômes: ${Array.isArray(context.symptoms) ? context.symptoms.join(', ') : context.symptoms}` : ''}
${context.duration ? `Durée: ${context.duration}` : ''}
${context.medical_history ? `Antécédents: ${Array.isArray(context.medical_history) ? context.medical_history.join(', ') : context.medical_history}` : ''}
${context.current_medications ? `Traitements: ${context.current_medications}` : ''}
${context.allergies ? `Allergies: ${context.allergies}` : ''}

Analyse les images cliniques suivantes et fournis un diagnostic différentiel structuré :
    `.trim()

    // Appel à OpenAI
    const { object: report } = await generateObject({
      model: openai(options.model || "gpt-4o"),
      schema: PhotoAnalysisSchema,
      system: DERMATOLOGY_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: contextText,
            },
            ...photo_urls.map((url: string) => ({
              type: "image" as const,
              image: url,
            })),
          ],
        },
      ],
      temperature: options.temperature || 0.2,
      maxTokens: options.maxTokens || 1500,
    })

    const latency = Date.now() - startTime
    const estimatedCost = photo_urls.length * 0.015 + 0.008 // Estimation GPT-4o Vision

    return NextResponse.json({
      success: true,
      analysis: report,
      metadata: {
        latency_ms: latency,
        estimated_cost_usd: estimatedCost,
        model: options.model || "gpt-4o",
        images_analyzed: photo_urls.length,
        timestamp: new Date().toISOString(),
        disclaimer: "Cette analyse est un outil d'aide au diagnostic. Consultez toujours un professionnel de santé."
      }
    })

  } catch (error) {
    console.error("Photo analysis error:", error)

    // Gestion des erreurs OpenAI spécifiques
    if (error instanceof Error) {
      if (error.message.includes('rate_limit')) {
        return NextResponse.json({ 
          error: "Limite de taux atteinte", 
          retry_after: 60 
        }, { status: 429 })
      }
      
      if (error.message.includes('invalid_image')) {
        return NextResponse.json({ 
          error: "Format d'image invalide",
          supported_formats: ["JPEG", "PNG", "WebP", "GIF"]
        }, { status: 422 })
      }

      if (error.message.includes('timeout')) {
        return NextResponse.json({ 
          error: "Délai d'attente dépassé",
          suggestion: "Réduire la taille/nombre d'images"
        }, { status: 504 })
      }
    }

    return NextResponse.json({ 
      error: "Erreur interne du serveur",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint pour documentation
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: "Tibok Photo Analysis API",
    version: "1.0.0",
    description: "API d'analyse dermatologique par IA",
    endpoints: {
      analyze: {
        method: "POST",
        path: "/api/v1/analyze-photos",
        headers: {
          "x-api-key": "YOUR_API_KEY",
          "Content-Type": "application/json"
        },
        body: {
          photo_urls: ["string[]", "URLs des images à analyser (max 5)"],
          context: {
            patient_age: "number (optionnel)",
            patient_gender: "string (optionnel)",
            symptoms: "string[] (optionnel)",
            duration: "string (optionnel)",
            medical_history: "string[] (optionnel)"
          },
          options: {
            model: "string (défaut: gpt-4o)",
            temperature: "number (défaut: 0.2)",
            maxTokens: "number (défaut: 1500)"
          }
        }
      }
    },
    supported_formats: ["JPEG", "PNG", "WebP", "GIF"],
    max_images_per_request: 5,
    disclaimer: "Outil d'aide au diagnostic uniquement. Consultez un professionnel de santé."
  })
}
