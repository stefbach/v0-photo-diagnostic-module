import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

// Schema for the photo analysis report
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

const DERMATOLOGY_SYSTEM_PROMPT = `Tu es un dermatologue expert avec 20 ans d'expérience clinique. 

Analyse les images cliniques fournies et produis un rapport JSON structuré selon le schéma demandé.

RÈGLES IMPORTANTES :
- Ne jamais poser de diagnostic certain, seulement des hypothèses différentielles
- Identifier tous les signaux d'alarme potentiels
- Être précis dans les descriptions morphologiques
- Limiter le diagnostic différentiel à 3 hypothèses maximum
- Utiliser la terminologie médicale française appropriée
- Toujours recommander une consultation médicale pour confirmation

CRITÈRES D'ANALYSE :
- Morphologie des lésions (macule, papule, plaque, nodule, etc.)
- Couleur et pigmentation
- Bordures (nettes, floues, irrégulières)
- Distribution et localisation
- Signes inflammatoires
- Asymétrie, bordures, couleur, diamètre (critères ABCD pour mélanome)

SIGNAUX D'ALARME À RECHERCHER :
- Asymétrie marquée
- Bordures irrégulières
- Couleurs multiples ou inhabituelle
- Diamètre > 6mm
- Évolution rapide
- Ulcération
- Saignement
- Prurit intense`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { consultation_id, photo_storage_paths } = body

    if (!consultation_id || !photo_storage_paths || !Array.isArray(photo_storage_paths)) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    // Verify user has access to this consultation
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", consultation_id)
      .single()

    if (consultationError || !consultation) {
      return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 })
    }

    if (consultation.patient_id !== user.id && consultation.doctor_id !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Generate signed URLs for the photos (5 minutes expiry for AI analysis)
    const signedUrls: string[] = []
    for (const path of photo_storage_paths) {
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from("clinical-photos")
        .createSignedUrl(path, 300)

      if (urlError || !signedUrl) {
        console.error("Error generating signed URL:", urlError)
        return NextResponse.json({ error: "Erreur lors de l'accès aux images" }, { status: 422 })
      }

      signedUrls.push(signedUrl.signedUrl)
    }

    // Get consultation context if available
    const { data: consultationState } = await supabase
      .from("consultations_state")
      .select("clinical_text")
      .eq("consultation_id", consultation_id)
      .single()

    // Prepare context for AI analysis
    const context = {
      patient_age: consultation.patient_age,
      patient_gender: consultation.patient_gender,
      chief_complaint: consultation.chief_complaint,
      symptoms: consultation.symptoms,
      medical_history: consultation.medical_history,
      current_medications: consultation.current_medications,
      clinical_context: consultationState?.clinical_text || {},
    }

    const startTime = Date.now()

    // Call OpenAI Vision API
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
Patient : ${context.patient_age} ans, ${context.patient_gender}
Motif de consultation : ${context.chief_complaint || "Non spécifié"}
Symptômes : ${Array.isArray(context.symptoms) ? context.symptoms.join(", ") : "Non spécifiés"}
Antécédents : ${Array.isArray(context.medical_history) ? context.medical_history.join(", ") : "Non spécifiés"}
Traitements actuels : ${context.current_medications || "Aucun"}

Analyse les images cliniques suivantes et fournis un rapport structuré :`,
            },
            ...signedUrls.map((url) => ({
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

    // Estimate cost (rough calculation for GPT-4o Vision)
    const estimatedCost = signedUrls.length * 0.01 + 0.005 // Base cost per image + text processing

    // Save the report to database
    const { data: savedReport, error: saveError } = await supabase
      .from("ai_photo_reports")
      .insert({
        consultation_id,
        model: "gpt-4o",
        prompt_version: "derm-v1",
        input_photos: photo_storage_paths,
        report,
        latency_ms: latency,
        cost_usd: estimatedCost,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving report:", saveError)
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 })
    }

    return NextResponse.json({
      photo_report_id: savedReport.id,
      report,
      metadata: {
        latency_ms: latency,
        cost_usd: estimatedCost,
        model: "gpt-4o",
        prompt_version: "derm-v1",
        images_analyzed: signedUrls.length,
      },
    })
  } catch (error) {
    console.error("Photo diagnosis error:", error)

    if (error instanceof Error) {
      // Handle specific OpenAI errors
      if (error.message.includes("rate_limit")) {
        return NextResponse.json({ error: "Limite de taux atteinte, veuillez réessayer plus tard" }, { status: 429 })
      }
      if (error.message.includes("timeout")) {
        return NextResponse.json({ error: "Délai d'attente dépassé" }, { status: 504 })
      }
      if (error.message.includes("invalid_image")) {
        return NextResponse.json({ error: "Format d'image invalide" }, { status: 422 })
      }
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// GET endpoint to retrieve existing photo reports
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const consultationId = searchParams.get("consultation_id")

    if (!consultationId) {
      return NextResponse.json({ error: "consultation_id requis" }, { status: 400 })
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Verify access to consultation
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select("patient_id, doctor_id")
      .eq("id", consultationId)
      .single()

    if (consultationError || !consultation) {
      return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 })
    }

    if (consultation.patient_id !== user.id && consultation.doctor_id !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Get photo reports
    const { data: reports, error: reportsError } = await supabase
      .from("ai_photo_reports")
      .select("*")
      .eq("consultation_id", consultationId)
      .order("created_at", { ascending: false })

    if (reportsError) {
      return NextResponse.json({ error: "Erreur lors de la récupération des rapports" }, { status: 500 })
    }

    return NextResponse.json({ reports: reports || [] })
  } catch (error) {
    console.error("Get photo reports error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
