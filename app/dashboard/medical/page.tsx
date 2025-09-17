import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MedicalDashboardStats } from "@/components/medical-dashboard-stats"
import { RecentConsultations } from "@/components/recent-consultations"
import { AIAnalyticsOverview } from "@/components/ai-analytics-overview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Brain, Users, TrendingUp } from "lucide-react"

export default async function MedicalDashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Check if user is a doctor or admin
  const { data: doctor } = await supabase.from("doctors").select("*").eq("user_id", user.id).single()

  const { data: admin } = await supabase.from("admins").select("*").eq("user_id", user.id).single()

  if (!doctor && !admin) {
    redirect("/consultations")
  }

  const userRole = doctor ? "doctor" : "admin"
  const userName = doctor?.full_name || admin?.full_name || user.email

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Tableau de bord médical</h1>
              <p className="text-muted-foreground">
                Bienvenue, {userName} • {userRole === "doctor" ? "Médecin" : "Administrateur"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            Module Tibok - Diagnostic IA
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <MedicalDashboardStats userId={user.id} userRole={userRole} />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Consultations */}
          <RecentConsultations userId={user.id} userRole={userRole} />

          {/* AI Analytics Overview */}
          <AIAnalyticsOverview userId={user.id} userRole={userRole} />
        </div>

        {/* Right Column - Quick Actions & Insights */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Actions rapides
              </CardTitle>
              <CardDescription>Accès direct aux fonctionnalités principales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="/consultations" className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Consultations</p>
                    <p className="text-sm text-muted-foreground">Gérer les consultations en cours</p>
                  </div>
                </div>
              </a>
              <a
                href="/dashboard/analytics"
                className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Analytiques IA</p>
                    <p className="text-sm text-muted-foreground">Statistiques détaillées</p>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>État du système</CardTitle>
              <CardDescription>Statut des services IA et infrastructure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Analyse photos (GPT-4o)</span>
                <Badge variant="default" className="bg-green-600">
                  Opérationnel
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Diagnostic global (GPT-4o-mini)</span>
                <Badge variant="default" className="bg-green-600">
                  Opérationnel
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Stockage Supabase</span>
                <Badge variant="default" className="bg-green-600">
                  Opérationnel
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Base de données</span>
                <Badge variant="default" className="bg-green-600">
                  Opérationnel
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Medical Disclaimer */}
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-amber-800 dark:text-amber-200 text-sm">
                Rappel de responsabilité médicale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Les analyses IA sont des outils d'aide au diagnostic. La responsabilité du diagnostic final et du
                traitement reste entièrement celle du médecin traitant.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
