"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DiagnosisRequestButton } from "@/components/diagnosis-request-button"
import {
  Brain,
  Eye,
  AlertTriangle,
  TestTube,
  Navigation,
  Clock,
  DollarSign,
  RefreshCw,
  FileText,
  Stethoscope,
} from "lucide-react"
import type { AIPhotoReport, AIDiagnosisReport, Lesion } from "@/lib/types/medical"

interface AIReportPanelProps {
  consultationId: string
  photoReport?: AIPhotoReport | null
  diagnosisReport?: AIDiagnosisReport | null
  onRequestDiagnosis?: () => void
  onRefresh?: () => void
}

export function AIReportPanel({
  consultationId,
  photoReport,
  diagnosisReport,
  onRequestDiagnosis,
  onRefresh,
}: AIReportPanelProps) {
  const [activeTab, setActiveTab] = useState("findings")

  if (!photoReport && !diagnosisReport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Rapports d'analyse IA
          </CardTitle>
          <CardDescription>Les rapports d'analyse apparaîtront ici après traitement des photos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun rapport d'analyse disponible</p>
            <p className="text-sm">Ajoutez des photos et lancez l'analyse pour commencer</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Rapports d'analyse IA
            </CardTitle>
            <CardDescription>Analyse automatisée des images cliniques et diagnostic différentiel</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {photoReport && (
              <Badge variant="outline" className="text-xs">
                {photoReport.model} • v{photoReport.prompt_version}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="findings" className="text-xs">
              <Eye className="h-4 w-4 mr-1" />
              Observations
            </TabsTrigger>
            <TabsTrigger value="differential" className="text-xs">
              <FileText className="h-4 w-4 mr-1" />
              Différentiel
            </TabsTrigger>
            <TabsTrigger value="red-flags" className="text-xs">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Alertes
            </TabsTrigger>
            <TabsTrigger value="tests" className="text-xs">
              <TestTube className="h-4 w-4 mr-1" />
              Examens
            </TabsTrigger>
            <TabsTrigger value="orientation" className="text-xs">
              <Navigation className="h-4 w-4 mr-1" />
              Orientation
            </TabsTrigger>
          </TabsList>

          {/* Image Findings Tab */}
          <TabsContent value="findings" className="space-y-4">
            {photoReport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Observations cliniques</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {photoReport.latency_ms}ms
                    </div>
                    {photoReport.cost_usd && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />${photoReport.cost_usd.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>

                {photoReport.report.lesions && photoReport.report.lesions.length > 0 ? (
                  <div className="space-y-3">
                    {photoReport.report.lesions.map((lesion: Lesion, index: number) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-primary">Lésion {index + 1}</h4>
                              {lesion.size_mm && (
                                <Badge variant="secondary" className="text-xs">
                                  {lesion.size_mm} mm
                                </Badge>
                              )}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-muted-foreground">Localisation:</span>
                                <p>{lesion.location}</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Morphologie:</span>
                                <p>{lesion.morphology}</p>
                              </div>
                              {lesion.borders && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Bordures:</span>
                                  <p>{lesion.borders}</p>
                                </div>
                              )}
                              {lesion.features && lesion.features.length > 0 && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Caractéristiques:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {lesion.features.map((feature, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <Eye className="h-4 w-4" />
                    <AlertDescription>Aucune lésion spécifique identifiée dans les images analysées.</AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analyse des images en attente</p>
              </div>
            )}
          </TabsContent>

          {/* Differential Diagnosis Tab */}
          <TabsContent value="differential" className="space-y-4">
            {photoReport ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Diagnostic différentiel</h3>
                {photoReport.report.diagnostic_diff && photoReport.report.diagnostic_diff.length > 0 ? (
                  <div className="space-y-2">
                    {photoReport.report.diagnostic_diff.map((diagnosis, index) => (
                      <Card key={index} className="border-l-4 border-l-secondary">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{diagnosis}</span>
                            <Badge variant="secondary">Hypothèse {index + 1}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>Aucun diagnostic différentiel proposé.</AlertDescription>
                  </Alert>
                )}

                {diagnosisReport && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Analyse clinique globale
                      </h4>
                      {diagnosisReport.report.diagnostic_diff && diagnosisReport.report.diagnostic_diff.length > 0 && (
                        <div className="space-y-2">
                          {diagnosisReport.report.diagnostic_diff.map((diff, index) => (
                            <Card key={index} className="border-l-4 border-l-accent">
                              <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{diff.label}</span>
                                  <Badge
                                    variant={
                                      diff.likelihood === "high"
                                        ? "default"
                                        : diff.likelihood === "moderate"
                                          ? "secondary"
                                          : "outline"
                                    }
                                  >
                                    {diff.likelihood === "high"
                                      ? "Probable"
                                      : diff.likelihood === "moderate"
                                        ? "Possible"
                                        : "Peu probable"}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Diagnostic différentiel en attente</p>
              </div>
            )}
          </TabsContent>

          {/* Red Flags Tab */}
          <TabsContent value="red-flags" className="space-y-4">
            <h3 className="text-lg font-semibold">Signaux d'alarme</h3>
            {photoReport && photoReport.report.red_flags && photoReport.report.red_flags.length > 0 ? (
              <div className="space-y-2">
                {photoReport.report.red_flags.map((flag, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="font-medium">{flag}</AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                <AlertTriangle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Aucun signal d'alarme majeur identifié dans l'analyse actuelle.
                </AlertDescription>
              </Alert>
            )}

            {diagnosisReport && diagnosisReport.report.red_flags && diagnosisReport.report.red_flags.length > 0 && (
              <>
                <Separator />
                <h4 className="font-semibold">Alertes cliniques globales</h4>
                <div className="space-y-2">
                  {diagnosisReport.report.red_flags.map((flag, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="font-medium">{flag}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-4">
            <h3 className="text-lg font-semibold">Examens complémentaires</h3>
            {photoReport && photoReport.report.suggested_tests && photoReport.report.suggested_tests.length > 0 ? (
              <div className="space-y-2">
                {photoReport.report.suggested_tests.map((test, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-primary" />
                        <span>{test}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <TestTube className="h-4 w-4" />
                <AlertDescription>Aucun examen complémentaire spécifique suggéré pour le moment.</AlertDescription>
              </Alert>
            )}

            {diagnosisReport &&
              diagnosisReport.report.recommended_exams &&
              diagnosisReport.report.recommended_exams.length > 0 && (
                <>
                  <Separator />
                  <h4 className="font-semibold">Examens recommandés (analyse globale)</h4>
                  <div className="space-y-2">
                    {diagnosisReport.report.recommended_exams.map((exam, index) => (
                      <Card key={index} className="border-l-4 border-l-accent">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2">
                            <TestTube className="h-4 w-4 text-accent" />
                            <span>{exam}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
          </TabsContent>

          {/* Orientation Tab */}
          <TabsContent value="orientation" className="space-y-4">
            <h3 className="text-lg font-semibold">Orientation thérapeutique</h3>
            {photoReport && photoReport.report.orientation ? (
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="font-medium">Recommandation initiale</span>
                  </div>
                  <p>{photoReport.report.orientation}</p>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <Navigation className="h-4 w-4" />
                <AlertDescription>Orientation thérapeutique en cours d'évaluation.</AlertDescription>
              </Alert>
            )}

            {diagnosisReport && (
              <>
                <Separator />
                <div className="space-y-4">
                  {diagnosisReport.report.treatment_hints && diagnosisReport.report.treatment_hints.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Pistes thérapeutiques</h4>
                      <div className="space-y-2">
                        {diagnosisReport.report.treatment_hints.map((hint, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <p>{hint}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {diagnosisReport.report.safety_net && (
                    <div>
                      <h4 className="font-semibold mb-2">Filet de sécurité</h4>
                      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 dark:text-amber-200">
                          {diagnosisReport.report.safety_net}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {diagnosisReport.report.explainability && (
                    <div>
                      <h4 className="font-semibold mb-2">Raisonnement clinique</h4>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground">{diagnosisReport.report.explainability}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </>
            )}

            {!diagnosisReport && photoReport && (
              <div className="pt-4">
                <DiagnosisRequestButton
                  consultationId={consultationId}
                  photoReportId={photoReport.id}
                  onDiagnosisComplete={onRequestDiagnosis}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Analysis Metadata */}
        {(photoReport || diagnosisReport) && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                {photoReport && (
                  <span>
                    Analyse photos: {new Date(photoReport.created_at).toLocaleDateString("fr-FR")} à{" "}
                    {new Date(photoReport.created_at).toLocaleTimeString("fr-FR")}
                  </span>
                )}
                {diagnosisReport && (
                  <span>
                    Diagnostic: {new Date(diagnosisReport.created_at).toLocaleDateString("fr-FR")} à{" "}
                    {new Date(diagnosisReport.created_at).toLocaleTimeString("fr-FR")}
                  </span>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                ID: {consultationId.slice(0, 8)}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
