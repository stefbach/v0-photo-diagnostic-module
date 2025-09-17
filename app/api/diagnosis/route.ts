import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"
import { DIAGNOSIS_PROMPTS, AI_CONFIG, COST_ESTIMATION } from "@/lib/utils/ai-prompts"
import { handleAIError, handleDatabaseError, logMedicalEvent } from "@/lib/utils/error-handling"

// Schema for the global diagnosis report
const DiagnosisReportSchema = z.object({
  diagnostic_diff: z
    .array(
      z.object({
        label: z.string().describe("Nom du diagnostic"),
        likelihood: z.enum(["high", "moderate", "low"]).describe("Probabilité du diagnostic"),
      }),
    )
    .describe("Diagnostic différentiel hiérarchisé"),
  red_flags: z.array(z.string()).describe("Signaux d'alarme cliniques identifiés"),
  recommended_exams: z.array(z.string()).describe("Examens complémentaires recommandés"),
  treatment_hints: z.array(z.string()).describe("Pistes thérapeutiques initiales"),
  safety_net: z.string().describe("Filet de sécurité et critères de réévaluation"),
  explainability: z.string().describe("Raisonnement clinique synthétique"),
})

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
    const { consultation_id, state_id, photo_report_id } = body

    if (!consultation_id) {
      return NextResponse.json({ error: "consultation_id requis" }, { status: 400 })
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

    // Gather all clinical data
    const clinicalData: any = {
      consultation_context: {
        patient_age: consultation.patient_age,
        patient_gender: consultation.patient_gender,
        chief_complaint: consultation.chief_complaint,
        symptoms: consultation.symptoms,
        medical_history: consultation.medical_history,
        current_medications: consultation.current_medications,
        allergies: consultation.allergies,
        consultation_reason: consultation.consultation_reason,
      },
      clinical_text: {},
      photo_report: null,
    }

    // Get consultation state if provided
    if (state_id) {
      const { data: consultationState, error: stateError } = await supabase
        .from("consultations_state")
        .select("clinical_text")
        .eq("id", state_id)
        .eq("consultation_id", consultation_id)
        .single()

      if (!stateError && consultationState) {
        clinicalData.clinical_text = consultationState.clinical_text
      }
    }

    // Get photo report if provided
    if (photo_report_id) {
      const { data: photoReport, error: photoError } = await supabase
        .from("ai_photo_reports")
        .select("*")
        .eq("id", photo_report_id)
        .eq("consultation_id", consultation_id)
        .single()

      if (!photoError && photoReport) {
        clinicalData.photo_report = photoReport.report
      }
    }

    // If no specific data provided, get the most recent photo report
    if (!photo_report_id && !state_id) {
      const { data: recentPhotoReport } = await supabase
        .from("ai_photo_reports")
        .select("*")
        .eq("consultation_id", consultation_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (recentPhotoReport) {
        clinicalData.photo_report = recentPhotoReport.report
      }

      const { data: recentState } = await supabase
        .from("consultations_state")
        .select("*")
        .eq("consultation_id", consultation_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (recentState) {
        clinicalData.clinical_text = recentState.clinical_text
      }
    }

    const startTime = Date.now()

    // Generate comprehensive diagnosis using AI
    const { object: report } = await generateObject({
      model: openai(AI_CONFIG.DIAGNOSIS.model),
      schema: DiagnosisReportSchema,
      system: DIAGNOSIS_PROMPTS.SYSTEM_V1,
      messages: [
        {
          role: "user",
          content: DIAGNOSIS_PROMPTS.USER_TEMPLATE(clinicalData),
        },
      ],
      temperature: AI_CONFIG.DIAGNOSIS.temperature,
      maxTokens: AI_CONFIG.DIAGNOSIS.maxTokens,
    })

    const latency = Date.now() - startTime
    const estimatedCost = COST_ESTIMATION.GPT_4O_MINI.perRequest

    // Save the diagnosis report to database
    const { data: savedReport, error: saveError } = await supabase
      .from("ai_diagnosis_reports")
      .insert({
        consultation_id,
        model: AI_CONFIG.DIAGNOSIS.model,
        prompt_version: "dx-v1",
        input_refs: {
          state_id: state_id || null,
          photo_report_id: photo_report_id || null,
        },
        report,
        latency_ms: latency,
        cost_usd: estimatedCost,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving diagnosis report:", saveError)
      throw handleDatabaseError(saveError)
    }

    // Log medical event
    logMedicalEvent("DIAGNOSIS_GENERATED", consultation_id, user.id, {
      report_id: savedReport.id,
      has_photo_analysis: !!clinicalData.photo_report,
      has_clinical_state: !!Object.keys(clinicalData.clinical_text).length,
      latency_ms: latency,
    })

    return NextResponse.json({
      diagnosis_report_id: savedReport.id,
      report,
      metadata: {
        latency_ms: latency,
        cost_usd: estimatedCost,
        model: AI_CONFIG.DIAGNOSIS.model,
        prompt_version: "dx-v1",
        data_sources: {
          consultation_data: true,
          photo_analysis: !!clinicalData.photo_report,
          clinical_state: !!Object.keys(clinicalData.clinical_text).length,
        },
      },
    })
  } catch (error) {
    console.error("Diagnosis error:", error)

    if (error instanceof Error) {
      const aiError = handleAIError(error)
      return NextResponse.json({ error: aiError.message }, { status: aiError.statusCode })
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// GET endpoint to retrieve existing diagnosis reports
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

    // Get diagnosis reports
    const { data: reports, error: reportsError } = await supabase
      .from("ai_diagnosis_reports")
      .select("*")
      .eq("consultation_id", consultationId)
      .order("created_at", { ascending: false })

    if (reportsError) {
      throw handleDatabaseError(reportsError)
    }

    return NextResponse.json({ reports: reports || [] })
  } catch (error) {
    console.error("Get diagnosis reports error:", error)

    if (error instanceof Error) {
      const dbError = handleDatabaseError(error)
      return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode })
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
