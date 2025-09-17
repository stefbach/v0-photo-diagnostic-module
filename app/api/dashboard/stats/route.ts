import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const role = searchParams.get("role")

    if (!userId || !role) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Build query conditions based on role
    let consultationFilter = ""
    if (role === "doctor") {
      consultationFilter = `doctor_id.eq.${userId}`
    }
    // For admin, no filter (access to all consultations)

    // Get basic consultation stats
    const { data: consultations, error: consultationsError } = await supabase
      .from("consultations")
      .select("id, created_at, patient_id")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    if (consultationsError) {
      console.error("Error fetching consultations:", consultationsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des données" }, { status: 500 })
    }

    const today = new Date().toISOString().split("T")[0]
    const consultationsToday = consultations?.filter((c) => c.created_at.startsWith(today)).length || 0

    // Get photo analysis stats
    const { data: photoReports, error: photoError } = await supabase.from("ai_photo_reports").select("*")

    if (photoError) {
      console.error("Error fetching photo reports:", photoError)
    }

    // Get diagnosis stats
    const { data: diagnosisReports, error: diagnosisError } = await supabase.from("ai_diagnosis_reports").select("*")

    if (diagnosisError) {
      console.error("Error fetching diagnosis reports:", diagnosisError)
    }

    // Get clinical photos stats
    const { data: clinicalPhotos, error: photosError } = await supabase.from("clinical_photos").select("*")

    if (photosError) {
      console.error("Error fetching clinical photos:", photosError)
    }

    // Calculate statistics
    const totalConsultations = consultations?.length || 0
    const consultationsWithPhotos = new Set(clinicalPhotos?.map((p) => p.consultation_id)).size || 0
    const totalPhotoAnalyses = photoReports?.length || 0
    const totalDiagnoses = diagnosisReports?.length || 0
    const totalPhotosUploaded = clinicalPhotos?.length || 0

    const totalAICost =
      (photoReports?.reduce((sum, report) => sum + (report.cost_usd || 0), 0) || 0) +
      (diagnosisReports?.reduce((sum, report) => sum + (report.cost_usd || 0), 0) || 0)

    const averageAnalysisTime =
      photoReports && photoReports.length > 0
        ? photoReports.reduce((sum, report) => sum + (report.latency_ms || 0), 0) / photoReports.length
        : 0

    // Count red flags
    let redFlagsDetected = 0
    photoReports?.forEach((report) => {
      if (report.report?.red_flags) {
        redFlagsDetected += report.report.red_flags.length
      }
    })
    diagnosisReports?.forEach((report) => {
      if (report.report?.red_flags) {
        redFlagsDetected += report.report.red_flags.length
      }
    })

    const stats = {
      total_consultations: totalConsultations,
      consultations_with_photos: consultationsWithPhotos,
      total_photo_analyses: totalPhotoAnalyses,
      total_diagnoses: totalDiagnoses,
      total_photos_uploaded: totalPhotosUploaded,
      total_ai_cost: totalAICost,
      average_analysis_time: averageAnalysisTime,
      red_flags_detected: redFlagsDetected,
      consultations_today: consultationsToday,
      pending_reviews: 0, // This would require additional business logic
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
