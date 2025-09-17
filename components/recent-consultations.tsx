"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Camera, Brain, Eye, ArrowRight } from "lucide-react"

interface RecentConsultationsProps {
  userId: string
  userRole: "doctor" | "admin"
}

interface ConsultationSummary {
  id: string
  patient_name: string
  patient_age: number
  chief_complaint: string
  created_at: string
  status: string
  has_photos: boolean
  has_ai_analysis: boolean
  photo_count: number
  red_flags_count: number
}

export function RecentConsultations({ userId, userRole }: RecentConsultationsProps) {
  const [consultations, setConsultations] = useState<ConsultationSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentConsultations()
  }, [userId, userRole])

  const loadRecentConsultations = async () => {
    try {
      const response = await fetch(`/api/dashboard/recent-consultations?user_id=${userId}&role=${userRole}&limit=5`)
      const data = await response.json()

      if (response.ok) {
        setConsultations(data.consultations)
      }
    } catch (error) {
      console.error("Error loading recent consultations:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consultations récentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
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
              <Calendar className="h-5 w-5" />
              Consultations récentes
            </CardTitle>
            <CardDescription>Dernières consultations avec analyse IA</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/consultations">
              Voir tout
              <ArrowRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {consultations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune consultation récente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Avatar>
                  <AvatarFallback>
                    {consultation.patient_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{consultation.patient_name}</p>
                    <Badge variant="outline" className="text-xs">
                      {consultation.patient_age} ans
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{consultation.chief_complaint}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(consultation.created_at).toLocaleDateString("fr-FR")}</span>
                    {consultation.has_photos && (
                      <div className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        {consultation.photo_count} photos
                      </div>
                    )}
                    {consultation.has_ai_analysis && (
                      <div className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        IA analysée
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={
                      consultation.status === "completed"
                        ? "default"
                        : consultation.status === "in_progress"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {consultation.status === "completed"
                      ? "Terminée"
                      : consultation.status === "in_progress"
                        ? "En cours"
                        : "En attente"}
                  </Badge>

                  {consultation.red_flags_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {consultation.red_flags_count} alerte{consultation.red_flags_count > 1 ? "s" : ""}
                    </Badge>
                  )}

                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/consultations/${consultation.id}/etat-clinique`}>
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
