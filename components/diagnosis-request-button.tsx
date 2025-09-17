"use client"

import { useState } from "react"
import { Stethoscope, Loader2, CheckCircle, AlertCircle, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AIDiagnosisReport } from "@/lib/types/medical"

interface DiagnosisRequestButtonProps {
  consultationId: string
  photoReportId?: string
  stateId?: string
  onDiagnosisComplete?: (report: AIDiagnosisReport) => void
  disabled?: boolean
}

type DiagnosisState = "idle" | "analyzing" | "done" | "error"

export function DiagnosisRequestButton({
  consultationId,
  photoReportId,
  stateId,
  onDiagnosisComplete,
  disabled = false,
}: DiagnosisRequestButtonProps) {
  const [state, setState] = useState<DiagnosisState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AIDiagnosisReport | null>(null)

  const handleDiagnosisRequest = async () => {
    setState("analyzing")
    setError(null)

    try {
      const response = await fetch("/api/diagnosis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consultation_id: consultationId,
          photo_report_id: photoReportId,
          state_id: stateId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'analyse diagnostique")
      }

      const newReport: AIDiagnosisReport = {
        id: data.diagnosis_report_id,
        consultation_id: consultationId,
        model: data.metadata.model,
        prompt_version: data.metadata.prompt_version,
        input_refs: {
          photo_report_id: photoReportId,
          state_id: stateId,
        },
        report: data.report,
        latency_ms: data.metadata.latency_ms,
        cost_usd: data.metadata.cost_usd,
        created_at: new Date().toISOString(),
      }

      setReport(newReport)
      setState("done")
      onDiagnosisComplete?.(newReport)
    } catch (err) {
      console.error("Diagnosis error:", err)
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
            Analyse diagnostique...
          </>
        )
      case "done":
        return (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Diagnostic généré
          </>
        )
      case "error":
        return (
          <>
            <AlertCircle className="h-4 w-4 mr-2" />
            Réessayer le diagnostic
          </>
        )
      default:
        return (
          <>
            <Stethoscope className="h-4 w-4 mr-2" />
            Générer un diagnostic global
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

      {state === "idle" && (
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-accent" />
              Analyse diagnostique globale
            </CardTitle>
            <CardDescription>
              Combinez l'analyse des photos avec les données cliniques pour obtenir un diagnostic différentiel complet
              et des recommandations thérapeutiques.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Corrélation clinico-iconographique</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Diagnostic différentiel hiérarchisé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Recommandations d'examens</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Pistes thérapeutiques</span>
                </div>
              </div>

              <Button
                onClick={handleDiagnosisRequest}
                disabled={disabled || state === "analyzing"}
                size="lg"
                className="w-full"
              >
                {getButtonContent()}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {state === "analyzing" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Analyse diagnostique en cours...</p>
                <p className="text-sm text-muted-foreground">
                  Notre IA clinicien synthétise toutes les données disponibles
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {state === "done" && report && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <div className="space-y-2">
              <p>
                <strong>Diagnostic global généré avec succès !</strong>
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span>Temps d'analyse: {report.latency_ms}ms</span>
                <span>Coût: ${report.cost_usd?.toFixed(4)}</span>
                <Badge variant="outline" className="text-xs">
                  {report.model}
                </Badge>
              </div>
              <p className="text-sm">
                Le rapport diagnostique complet est maintenant disponible dans les onglets ci-dessus. Il inclut un
                diagnostic différentiel, des recommandations d'examens et des pistes thérapeutiques.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
