"use client"

import { useState } from "react"
import { Brain, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { ClinicalPhoto, AIPhotoReport } from "@/lib/types/medical"

interface SubmitForAnalysisButtonProps {
  consultationId: string
  photos: ClinicalPhoto[]
  onAnalysisComplete?: (report: AIPhotoReport) => void
  disabled?: boolean
}

type AnalysisState = "idle" | "uploading" | "analyzing" | "done" | "error"

export function SubmitForAnalysisButton({
  consultationId,
  photos,
  onAnalysisComplete,
  disabled = false,
}: SubmitForAnalysisButtonProps) {
  const [state, setState] = useState<AnalysisState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AIPhotoReport | null>(null)

  const handleAnalysis = async () => {
    if (photos.length === 0) {
      setError("Aucune photo à analyser")
      return
    }

    setState("analyzing")
    setError(null)

    try {
      const response = await fetch("/api/photo-diagnosis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consultation_id: consultationId,
          photo_storage_paths: photos.map((p) => p.storage_path),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'analyse")
      }

      const newReport: AIPhotoReport = {
        id: data.photo_report_id,
        consultation_id: consultationId,
        model: data.metadata.model,
        prompt_version: data.metadata.prompt_version,
        input_photos: photos.map((p) => p.storage_path),
        report: data.report,
        latency_ms: data.metadata.latency_ms,
        cost_usd: data.metadata.cost_usd,
        created_at: new Date().toISOString(),
      }

      setReport(newReport)
      setState("done")
      onAnalysisComplete?.(newReport)
    } catch (err) {
      console.error("Analysis error:", err)
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      setState("error")
    }
  }

  const getButtonContent = () => {
    switch (state) {
      case "analyzing":
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Analyse en cours...
          </>
        )
      case "done":
        return (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Analyse terminée
          </>
        )
      case "error":
        return (
          <>
            <AlertCircle className="h-4 w-4 mr-2" />
            Réessayer l'analyse
          </>
        )
      default:
        return (
          <>
            <Brain className="h-4 w-4 mr-2" />
            Analyser les photos
          </>
        )
    }
  }

  const getButtonVariant = () => {
    switch (state) {
      case "done":
        return "default" as const
      case "error":
        return "destructive" as const
      default:
        return "default" as const
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAnalysis}
            disabled={disabled || photos.length === 0 || state === "analyzing"}
            variant={getButtonVariant()}
            size="lg"
          >
            {getButtonContent()}
          </Button>

          {photos.length > 0 && (
            <Badge variant="secondary">
              {photos.length} photo{photos.length > 1 ? "s" : ""} à analyser
            </Badge>
          )}
        </div>

        {report && (
          <div className="text-sm text-muted-foreground">
            <p>Analyse terminée en {report.latency_ms}ms</p>
            <p>Coût estimé: ${report.cost_usd?.toFixed(4)}</p>
          </div>
        )}
      </div>

      {state === "done" && report && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Analyse IA terminée avec succès !</strong>
            <br />
            Le rapport d'analyse est maintenant disponible. Vous pouvez consulter les résultats dans l'onglet "Rapport
            IA" ci-dessous.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
