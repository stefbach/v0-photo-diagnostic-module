"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Brain, Camera, Stethoscope, TrendingUp, Clock, DollarSign, AlertTriangle } from "lucide-react"

interface MedicalDashboardStatsProps {
  userId: string
  userRole: "doctor" | "admin"
}

interface DashboardStats {
  total_consultations: number
  consultations_with_photos: number
  total_photo_analyses: number
  total_diagnoses: number
  total_photos_uploaded: number
  total_ai_cost: number
  average_analysis_time: number
  red_flags_detected: number
  consultations_today: number
  pending_reviews: number
}

export function MedicalDashboardStats({ userId, userRole }: MedicalDashboardStatsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [userId, userRole])

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/dashboard/stats?user_id=${userId}&role=${userRole}`)
      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Impossible de charger les statistiques</p>
        </CardContent>
      </Card>
    )
  }

  const statCards = [
    {
      title: "Consultations totales",
      value: stats.total_consultations,
      description: `${stats.consultations_today} aujourd'hui`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Analyses photos",
      value: stats.total_photo_analyses,
      description: `${stats.consultations_with_photos} consultations avec photos`,
      icon: Camera,
      color: "text-green-600",
    },
    {
      title: "Diagnostics IA",
      value: stats.total_diagnoses,
      description: "Rapports générés",
      icon: Brain,
      color: "text-purple-600",
    },
    {
      title: "Photos analysées",
      value: stats.total_photos_uploaded,
      description: "Images traitées",
      icon: Stethoscope,
      color: "text-cyan-600",
    },
    {
      title: "Temps moyen",
      value: `${Math.round(stats.average_analysis_time / 1000)}s`,
      description: "Analyse par photo",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Coût total IA",
      value: `$${stats.total_ai_cost.toFixed(2)}`,
      description: "Analyses cumulées",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Signaux d'alarme",
      value: stats.red_flags_detected,
      description: "Détectés par l'IA",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "En attente",
      value: stats.pending_reviews,
      description: "Révisions médicales",
      icon: TrendingUp,
      color: "text-amber-600",
    },
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
