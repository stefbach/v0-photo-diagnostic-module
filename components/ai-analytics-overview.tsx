"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface AIAnalyticsOverviewProps {
  userId: string
  userRole: "doctor" | "admin"
}

interface AIAnalytics {
  total_analyses: number
  success_rate: number
  average_confidence: number
  most_common_diagnoses: Array<{ diagnosis: string; count: number }>
  red_flags_by_type: Array<{ type: string; count: number }>
  performance_metrics: {
    avg_latency_ms: number
    total_cost_usd: number
    analyses_last_7_days: number
    trend_percentage: number
  }
}

export function AIAnalyticsOverview({ userId, userRole }: AIAnalyticsOverviewProps) {
  const [analytics, setAnalytics] = useState<AIAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [userId, userRole])

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/dashboard/ai-analytics?user_id=${userId}&role=${userRole}`)
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error("Error loading AI analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytiques IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Impossible de charger les analytiques IA</p>
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
              Analytiques IA
            </CardTitle>
            <CardDescription>Performance et insights des analyses automatisées</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {analytics.performance_metrics.analyses_last_7_days} analyses (7j)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taux de succès</span>
              <span className="text-sm text-muted-foreground">{analytics.success_rate.toFixed(1)}%</span>
            </div>
            <Progress value={analytics.success_rate} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Confiance moyenne</span>
              <span className="text-sm text-muted-foreground">{analytics.average_confidence.toFixed(1)}%</span>
            </div>
            <Progress value={analytics.average_confidence} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Latence moyenne</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(analytics.performance_metrics.avg_latency_ms / 1000)}s</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp
                className={`h-4 w-4 ${analytics.performance_metrics.trend_percentage >= 0 ? "text-green-600" : "text-red-600"}`}
              />
              <span className="text-sm font-medium">Tendance (7j)</span>
            </div>
            <p className="text-2xl font-bold">
              {analytics.performance_metrics.trend_percentage >= 0 ? "+" : ""}
              {analytics.performance_metrics.trend_percentage.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Most Common Diagnoses */}
        {analytics.most_common_diagnoses.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Diagnostics les plus fréquents
            </h4>
            <div className="space-y-2">
              {analytics.most_common_diagnoses.slice(0, 5).map((diagnosis, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{diagnosis.diagnosis}</span>
                  <Badge variant="secondary">{diagnosis.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Red Flags Analysis */}
        {analytics.red_flags_by_type.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Signaux d'alarme détectés
            </h4>
            <div className="space-y-2">
              {analytics.red_flags_by_type.slice(0, 3).map((flag, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{flag.type}</span>
                  <Badge variant="destructive">{flag.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Information */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Coût total des analyses IA</span>
            <span className="font-medium">${analytics.performance_metrics.total_cost_usd.toFixed(4)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
