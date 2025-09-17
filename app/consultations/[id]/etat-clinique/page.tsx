import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClinicalPhotoCapture } from "@/components/clinical-photo-capture"
import { ClinicalPhotoList } from "@/components/clinical-photo-list"
import { SubmitForAnalysisButton } from "@/components/submit-for-analysis-button"
import { AIReportPanel } from "@/components/ai-report-panel"
import { AIReportHistory } from "@/components/ai-report-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Brain } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EtatCliniquePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/auth/login")
  }

  // Get consultation details
  const { data: consultation, error: consultationError } = await supabase
    .from("consultations")
    .select("*")
    .eq("id", id)
    .single()

  if (consultationError || !consultation) {
    redirect("/consultations")
  }

  // Check if user has access to this consultation
  if (consultation.patient_id !== user.id && consultation.doctor_id !== user.id) {
    redirect("/consultations")
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">État clinique</h1>
          <Badge variant="outline">Consultation #{consultation.id.slice(0, 8)}</Badge>
        </div>
        <p className="text-muted-foreground">
          Ajoutez des photos de votre condition cutanée pour obtenir une analyse IA préliminaire.
        </p>
      </div>

      {/* Process Steps */}
      <Card className="bg-gradient-to-r from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Processus d'analyse IA
          </CardTitle>
          <CardDescription>Votre parcours vers un pré-diagnostic assisté par intelligence artificielle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium mb-1">Capture des photos</h3>
                <p className="text-sm text-muted-foreground">Ajoutez 1 à 5 photos claires de votre condition cutanée</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium mb-1">Analyse IA</h3>
                <p className="text-sm text-muted-foreground">
                  Notre IA dermatologue analyse vos images en quelques secondes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium mb-1">Rapport médical</h3>
                <p className="text-sm text-muted-foreground">
                  Recevez un pré-diagnostic détaillé à valider par un médecin
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Photo Management */}
        <div className="space-y-6">
          {/* Photo Capture Section */}
          <ClinicalPhotoCapture consultationId={id} />

          {/* Existing Photos */}
          <ClinicalPhotoList consultationId={id} />

          {/* Analysis Button */}
          <SubmitForAnalysisButton consultationId={id} photos={[]} />
        </div>

        {/* Right Column - AI Reports */}
        <div className="space-y-6">
          {/* Report History */}
          <AIReportHistory consultationId={id} />

          {/* Current Report Display */}
          <AIReportPanel consultationId={id} />
        </div>
      </div>

      {/* Medical Disclaimer */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">!</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-amber-800 dark:text-amber-200">Avertissement médical important</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                L'analyse automatisée fournie par notre IA est un outil d'aide au diagnostic uniquement. Elle ne
                remplace en aucun cas l'avis d'un médecin qualifié. Consultez toujours un professionnel de santé pour un
                diagnostic définitif et un traitement approprié.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
