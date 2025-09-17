import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Brain, Camera, Shield, ArrowRight, Users } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If authenticated, redirect to appropriate dashboard
  if (user) {
    // Check user role
    const { data: doctor } = await supabase.from("doctors").select("*").eq("user_id", user.id).single()

    const { data: admin } = await supabase.from("admins").select("*").eq("user_id", user.id).single()

    if (doctor || admin) {
      redirect("/dashboard/medical")
    } else {
      redirect("/consultations")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">Tibok</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Module Photo-Diagnostic
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <a href="/auth/login">Connexion</a>
              </Button>
              <Button asChild>
                <a href="/auth/sign-up">S'inscrire</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-balance">
              Diagnostic dermatologique assisté par{" "}
              <span className="text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Intelligence Artificielle
              </span>
            </h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Analysez vos conditions cutanées avec notre IA médicale avancée. Obtenez un pré-diagnostic rapide et
              sécurisé pour orienter votre consultation médicale.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/auth/sign-up">
                Commencer l'analyse
                <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/auth/login">
                <Users className="h-5 w-5 mr-2" />
                Espace professionnel
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">Comment ça fonctionne</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Notre processus en 3 étapes pour une analyse dermatologique complète et sécurisée
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>1. Capture sécurisée</CardTitle>
              <CardDescription>
                Prenez ou uploadez 1 à 5 photos de votre condition cutanée. Compression automatique et chiffrement
                médical.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>2. Analyse IA</CardTitle>
              <CardDescription>
                Notre IA dermatologue expert analyse vos images en quelques secondes avec GPT-4o Vision pour identifier
                les lésions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Stethoscope className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>3. Rapport médical</CardTitle>
              <CardDescription>
                Recevez un pré-diagnostic structuré avec diagnostic différentiel, examens suggérés et orientation
                thérapeutique.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-3xl font-bold">Sécurité et conformité</h2>
              </div>
              <p className="text-muted-foreground">
                Vos données médicales sont protégées selon les plus hauts standards de sécurité
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conformité RGPD/HIPAA</CardTitle>
                  <CardDescription>
                    Respect strict des réglementations européennes et américaines sur la protection des données de
                    santé.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chiffrement bout en bout</CardTitle>
                  <CardDescription>
                    Toutes vos images sont chiffrées lors du stockage et de la transmission. URLs signées temporaires
                    pour l'analyse IA.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contrôle d'accès strict</CardTitle>
                  <CardDescription>
                    Seuls vous et votre équipe médicale avez accès à vos données. Politiques RLS au niveau base de
                    données.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audit et traçabilité</CardTitle>
                  <CardDescription>
                    Journalisation complète des accès et modifications. Historique des analyses pour suivi médical.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">!</span>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Avertissement médical important</h3>
                <p className="text-amber-700 dark:text-amber-300">
                  L'analyse automatisée fournie par notre IA est un outil d'aide au diagnostic uniquement. Elle ne
                  remplace en aucun cas l'avis d'un médecin qualifié. Consultez toujours un professionnel de santé pour
                  un diagnostic définitif et un traitement approprié. En cas d'urgence médicale, contactez immédiatement
                  les services d'urgence.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <span className="font-semibold">Tibok</span>
              <Badge variant="outline" className="text-xs">
                v1.0
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Tibok. Module de diagnostic photo médical assisté par IA.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
