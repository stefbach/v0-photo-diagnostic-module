"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { History, Eye, FileText, Clock, DollarSign, RefreshCw } from "lucide-react"
import type { AIPhotoReport, AIDiagnosisReport } from "@/lib/types/medical"

interface AIReportHistoryProps {
  consultationId: string
  onSelectReport?: (photoReport: AIPhotoReport | null, diagnosisReport: AIDiagnosisReport | null) => void
}

interface ReportHistoryItem {
  photoReport: AIPhotoReport
  diagnosisReport?: AIDiagnosisReport
}

export function AIReportHistory({ consultationId, onSelectReport }: AIReportHistoryProps) {
  const [reports, setReports] = useState<ReportHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
  }, [consultationId])

  const loadReports = async () => {
    try {
      setLoading(true)

      // Load photo reports
      const photoResponse = await fetch(`/api/photo-diagnosis?consultation_id=${consultationId}`)
      const photoData = await photoResponse.json()

      // Load diagnosis reports
      const diagnosisResponse = await fetch(`/api/diagnosis?consultation_id=${consultationId}`)
      const diagnosisData = await diagnosisResponse.json()

      // Combine reports by matching photo report IDs
      const combinedReports: ReportHistoryItem[] = []

      if (photoData.reports) {
        for (const photoReport of photoData.reports) {
          const matchingDiagnosis = diagnosisData.reports?.find(
            (dr: AIDiagnosisReport) => dr.input_refs.photo_report_id === photoReport.id,
          )

          combinedReports.push({
            photoReport,
            diagnosisReport: matchingDiagnosis,
          })
        }
      }

      setReports(combinedReports)

      // Auto-select the most recent report
      if (combinedReports.length > 0) {
        const latest = combinedReports[0]
        setSelectedReportId(latest.photoReport.id)
        onSelectReport?.(latest.photoReport, latest.diagnosisReport || null)
      }
    } catch (error) {
      console.error("Error loading reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectReport = (item: ReportHistoryItem) => {
    setSelectedReportId(item.photoReport.id)
    onSelectReport?.(item.photoReport, item.diagnosisReport || null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des analyses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des analyses
          </CardTitle>
          <CardDescription>Aucune analyse n'a encore été effectuée pour cette consultation.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des analyses
            </CardTitle>
            <CardDescription>
              {reports.length} analyse{reports.length > 1 ? "s" : ""} effectuée{reports.length > 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadReports}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.map((item, index) => (
          <div key={item.photoReport.id}>
            <Card
              className={`cursor-pointer transition-colors ${
                selectedReportId === item.photoReport.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50 hover:bg-muted/50"
              }`}
              onClick={() => handleSelectReport(item)}
            >
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? "Plus récente" : `Analyse ${reports.length - index}`}
                      </Badge>
                      {item.diagnosisReport && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Diagnostic complet
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.photoReport.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-primary" />
                        <span>{item.photoReport.input_photos.length} photos analysées</span>
                      </div>
                      {item.photoReport.report.lesions && (
                        <div className="flex items-center gap-1">
                          <span>{item.photoReport.report.lesions.length} lésions identifiées</span>
                        </div>
                      )}
                    </div>

                    {/* Diagnostic Preview */}
                    {item.photoReport.report.diagnostic_diff && item.photoReport.report.diagnostic_diff.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Hypothèses: </span>
                        <span>{item.photoReport.report.diagnostic_diff.slice(0, 2).join(", ")}</span>
                        {item.photoReport.report.diagnostic_diff.length > 2 && <span>...</span>}
                      </div>
                    )}

                    {/* Red Flags Preview */}
                    {item.photoReport.report.red_flags && item.photoReport.report.red_flags.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <span className="font-medium">
                          {item.photoReport.report.red_flags.length} signal(aux) d'alarme
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.photoReport.latency_ms}ms
                      </div>
                      {item.photoReport.cost_usd && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />${item.photoReport.cost_usd.toFixed(4)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.photoReport.model}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        v{item.photoReport.prompt_version}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {index < reports.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
