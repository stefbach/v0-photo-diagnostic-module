import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleDatabaseError } from "@/lib/utils/error-handling"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET endpoint to retrieve all AI reports for a consultation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: consultationId } = await params
    const supabase = await createClient()

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
    const { data: photoReports, error: photoError } = await supabase
      .from("ai_photo_reports")
      .select("*")
      .eq("consultation_id", consultationId)
      .order("created_at", { ascending: false })

    if (photoError) {
      throw handleDatabaseError(photoError)
    }

    // Get diagnosis reports
    const { data: diagnosisReports, error: diagnosisError } = await supabase
      .from("ai_diagnosis_reports")
      .select("*")
      .eq("consultation_id", consultationId)
      .order("created_at", { ascending: false })

    if (diagnosisError) {
      throw handleDatabaseError(diagnosisError)
    }

    // Get clinical photos for context
    const { data: clinicalPhotos, error: photosError } = await supabase
      .from("clinical_photos")
      .select("*")
      .eq("consultation_id", consultationId)
      .order("created_at", { ascending: false })

    if (photosError) {
      throw handleDatabaseError(photosError)
    }

    // Calculate summary statistics
    const summary = {
      total_photo_reports: photoReports?.length || 0,
      total_diagnosis_reports: diagnosisReports?.length || 0,
      total_photos_analyzed: clinicalPhotos?.length || 0,
      latest_analysis: photoReports?.[0]?.created_at || null,
      latest_diagnosis: diagnosisReports?.[0]?.created_at || null,
      total_cost_usd:
        (photoReports?.reduce((sum, report) => sum + (report.cost_usd || 0), 0) || 0) +
        (diagnosisReports?.reduce((sum, report) => sum + (report.cost_usd || 0), 0) || 0),
      average_latency_ms: {
        photo_analysis:
          photoReports?.length > 0
            ? photoReports.reduce((sum, report) => sum + (report.latency_ms || 0), 0) / photoReports.length
            : 0,
        diagnosis:
          diagnosisReports?.length > 0
            ? diagnosisReports.reduce((sum, report) => sum + (report.latency_ms || 0), 0) / diagnosisReports.length
            : 0,
      },
    }

    return NextResponse.json({
      photo_reports: photoReports || [],
      diagnosis_reports: diagnosisReports || [],
      clinical_photos: clinicalPhotos || [],
      summary,
    })
  } catch (error) {
    console.error("Get AI reports error:", error)

    if (error instanceof Error) {
      const dbError = handleDatabaseError(error)
      return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode })
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
