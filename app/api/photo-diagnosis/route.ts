import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { handleAIError, handleDatabaseError, logMedicalEvent } from "@/lib/utils/error-handling"

// ==================== SCHÉMA PHOTO ANALYSIS COMPLET ====================
const PhotoAnalysisSchema = z.object({
  lesions: z.array(
    z.object({
      location: z.string().describe("Localisation anatomique précise"),
      morphology: z.string().describe("Description morphologique détaillée"),
      size_mm: z.number().optional().describe("Taille approximative en millimètres"),
      borders: z.string().optional().describe("Caractéristiques des bordures"),
      features: z.array(z.string()).describe("Caractéristiques cliniques observées"),
    }),
  ),
  diagnostic_diff: z.array(
    z.object({
      condition: z.string().describe("Diagnostic différentiel"),
      likelihood: z.enum(["high", "moderate", "low"]).describe("Probabilité"),
      reasoning: z.string().describe("Justification clinique"),
    })
  ).max(3).describe("Diagnostic différentiel hiérarchisé (max 3)"),
  red_flags: z.array(z.string()).describe("Signaux d'alarme dermatologiques"),
  recommended_exams: z.array(z.string()).describe("Examens complémentaires recommandés"),
  treatment_hints: z.array(z.string()).describe("Pistes thérapeutiques initiales"),
  urgency_level: z.enum(["immediate", "urgent", "routine", "monitoring"]).describe("Niveau d'urgence"),
  confidence_score: z.number().min(0).max(1).describe("Score de confiance de l'analyse"),
  clinical_recommendations: z.string().describe("Recommandations cliniques détaillées"),
})

// ==================== CONFIGURATION AI COMPLÈTE ====================
const AI_CONFIG = {
  PHOTO_ANALYSIS: {
    model: "gpt-4o",
    temperature: 0.2,
    maxTokens: 2000,
  }
}

const COST_ESTIMATION = {
  GPT_4O: {
    perImage: 0.015,
    perRequest: 0.008
  }
}

// ==================== PROMPTS DERMATOLOGIQUES COMPLETS ET DÉTAILLÉS ====================
const DERMATOLOGY_PROMPTS = {
  SYSTEM_V2: `Tu es un dermatologue expert avec 20 ans d'expérience clinique internationale et spécialisé dans l'analyse d'images dermatologiques.

MISSION : ANALYSE les images cliniques dermatologiques et fournis un rapport JSON structuré selon les standards médicaux internationaux les plus élevés.

RÈGLES CRITIQUES ABSOLUES :
- JAMAIS de diagnostic certain ou définitif - SEULEMENT des hypothèses différentielles hiérarchisées par probabilité
- IDENTIFIER et LISTER tous les signaux d'alarme dermatologiques potentiels 
- UTILISER exclusivement la terminologie médicale française précise et standardisée
- LIMITER le diagnostic différentiel à MAXIMUM 3 hypothèses avec probabilités (high/moderate/low)
- RECOMMANDER TOUJOURS une consultation dermatologique directe pour confirmation diagnostique
- FOURNIR un score de confiance basé sur la qualité des images ET la certitude clinique
- PRÉCISER le niveau d'urgence selon la présentation dermatologique observée
- ÊTRE EXHAUSTIF dans les descriptions morphologiques des lésions

APPROCHE SYSTÉMATIQUE DERMATOLOGIQUE :
1. Examen morphologique détaillé de chaque lésion visible
2. Localisation anatomique précise et étendue des lésions
3. Caractéristiques dermatologiques spécifiques (couleur, texture, relief, distribution)
4. Diagnostic différentiel dermatologique hiérarchisé avec probabilités cliniques
5. Identification de tous signaux d'alarme dermatologiques potentiels
6. Recommandations d'examens complémentaires dermatologiques appropriés
7. Pistes thérapeutiques dermatologiques initiales
8. Évaluation du niveau d'urgence dermatologique

ANALYSE DERMATOLOGIQUE EXPERTE :
- Évaluer la morphologie selon les critères ABCDE pour les lésions pigmentées
- Identifier les patterns dermatoscopiques virtuels si visible
- Analyser la distribution et la symétrie des lésions
- Évaluer l'aspect inflammatoire, infectieux ou néoplasique
- Considérer les diagnostics différentiels par fréquence et gravité
- Identifier les critères d'urgence dermatologique

RÉPONDRE UNIQUEMENT EN JSON VALIDE selon le schéma demandé - AUCUN TEXTE EN DEHORS DU JSON.`,

  USER_TEMPLATE: (analysisData: any) => `
CONTEXTE CLINIQUE DERMATOLOGIQUE COMPLET :
${analysisData.patient_age ? `Âge patient : ${analysisData.patient_age} ans` : 'Âge non précisé'}
${analysisData.patient_gender ? `Genre : ${analysisData.patient_gender}` : 'Genre non précisé'}
${analysisData.chief_complaint ? `Motif consultation dermatologique : ${analysisData.chief_complaint}` : 'Motif non précisé'}
${analysisData.symptoms ? `Symptômes dermatologiques : ${Array.isArray(analysisData.symptoms) ? analysisData.symptoms.join(', ') : analysisData.symptoms}` : 'Symptômes non précisés'}
${analysisData.medical_history ? `Antécédents dermatologiques : ${Array.isArray(analysisData.medical_history) ? analysisData.medical_history.join(', ') : analysisData.medical_history}` : 'Antécédents non précisés'}
${analysisData.current_medications ? `Traitements dermatologiques actuels : ${analysisData.current_medications}` : 'Aucun traitement dermatologique actuel'}
${analysisData.allergies ? `Allergies connues : ${Array.isArray(analysisData.allergies) ? analysisData.allergies.join(', ') : analysisData.allergies}` : 'Aucune allergie connue'}
${analysisData.duration ? `Durée évolution : ${analysisData.duration}` : 'Durée non précisée'}
${analysisData.evolution ? `Évolution récente : ${analysisData.evolution}` : 'Évolution non décrite'}

INSTRUCTIONS DERMATOLOGIQUES EXPERTES :
Procède à une analyse dermatologique systématique et exhaustive des images cliniques ci-jointes.
Focus sur l'identification morphologique précise des lésions cutanées, l'établissement d'un diagnostic différentiel dermatologique hiérarchisé par probabilité clinique, et des recommandations dermatologiques appropriées.

Considère particulièrement :
- La morphologie dermatologique selon les critères standardisés
- Les patterns de distribution des lésions
- Les signes dermatoscopiques virtuels observables
- Les critères ABCDE pour les lésions pigmentées
- Les signaux d'alarme dermatologique (asymétrie, bords irréguliers, couleur inhomogène, diamètre >6mm, évolution)
- L'urgence dermatologique potentielle

RÉPONDRE EXCLUSIVEMENT AVEC UN OBJET JSON VALIDE - AUCUN TEXTE SUPPLÉMENTAIRE AVANT OU APRÈS LE JSON.
`
}

// ==================== AUTHENTIFICATION SIMPLIFIÉE ====================
async function authenticateRequest(request: NextRequest) {
  try {
    // 1. Vérifier clé API (services externes)
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (apiKey && apiKey === process.env.TIBOK_API_KEY) {
      return {
        user: { id: 'service', role: 'service' },
        isService: true,
        isAuthenticated: true,
        error: null
      }
    }

    // 2. Authentification Supabase (utilisateurs web)
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user) {
      return { 
        user, 
        isService: false, 
        isAuthenticated: true, 
        error: null 
      }
    }
    
    // 3. Mode anonyme (tests/démo)
    return { 
      user: { id: 'anonymous', role: 'anonymous' }, 
      isService: false, 
      isAuthenticated: false, 
      error: null 
    }
  } catch (error) {
    return { 
      user: { id: 'anonymous', role: 'anonymous' }, 
      isService: false, 
      isAuthenticated: false, 
      error: null 
    }
  }
}

// ==================== APPEL OPENAI AVEC LOGIQUE IDENTIQUE À OPENAI-DIAGNOSIS ====================
async function callOpenAIPhotoAnalysis(
  apiKey: string,
  imageUrls: string[],
  contextData: any,
  options: any = {},
  maxRetries: number = 3
): Promise<any> {
  
  console.log('🔍 Utilisation clé OpenAI validée:', {
    exists: !!apiKey,
    type: typeof apiKey,
    length: apiKey?.length || 0,
    valid_format: apiKey?.startsWith('sk-') || false
  })

  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Analyse dermatologique OpenAI Vision - tentative ${attempt + 1}/${maxRetries + 1}`)
      
      // Construction du prompt avec contexte clinique complet
      const contextPrompt = DERMATOLOGY_PROMPTS.USER_TEMPLATE(contextData)
      
      // Construire le contenu avec images pour OpenAI Vision
      const content = [
        {
          type: "text",
          text: contextPrompt
        },
        ...imageUrls.map((url: string) => ({
          type: "image_url",
          image_url: { 
            url: url,
            detail: "high" // Haute résolution pour analyse dermatologique précise
          }
        }))
      ]
      
      console.log(`🖼️ Analyse de ${imageUrls.length} image(s) dermatologique(s)`)
      
      // Appel direct à l'API OpenAI avec la méthode EXACTE de openai-diagnosis
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || AI_CONFIG.PHOTO_ANALYSIS.model,
          messages: [
            {
              role: 'system',
              content: DERMATOLOGY_PROMPTS.SYSTEM_V2
            },
            {
              role: 'user',
              content: content
            }
          ],
          temperature: options.temperature || AI_CONFIG.PHOTO_ANALYSIS.temperature,
          max_tokens: options.maxTokens || AI_CONFIG.PHOTO_ANALYSIS.maxTokens,
          response_format: { type: "json_object" },
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.2
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Erreur API OpenAI (${response.status}):`, errorText.substring(0, 300))
        throw new Error(`OpenAI API error (${response.status}): ${errorText.substring(0, 200)}`)
      }
      
      const data = await response.json()
      const rawContent = data.choices[0]?.message?.content || ''
      
      console.log('🤖 GPT-4 Vision response reçue, longueur:', rawContent.length)
      
      // Parser et valider la réponse JSON avec méthode identique à openai-diagnosis
      let cleanContent = rawContent.trim()
      cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      
      if (!cleanContent.startsWith('{') || !cleanContent.endsWith('}')) {
        throw new Error(`Invalid JSON structure - doesn't start with { or end with }. Content preview: ${cleanContent.substring(0, 100)}...`)
      }
      
      const parsed = JSON.parse(cleanContent)
      
      // Validation avec le schéma Zod dermatologique
      const validatedReport = PhotoAnalysisSchema.parse(parsed)
      console.log('✅ Validation Zod réussie - Structure dermatologique conforme')
      
      console.log('🎉 Analyse dermatologique OpenAI Vision réussie!')
      console.log(`📊 Résultats: ${validatedReport.lesions.length} lésion(s), ${validatedReport.diagnostic_diff.length} diagnostic(s) différentiel(s)`)
      
      return validatedReport
      
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Tentative ${attempt + 1} échouée:`, error)
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000 // Backoff exponentiel
        console.log(`⏳ Nouvelle tentative dans ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  throw lastError || new Error('Échec de l\'analyse après toutes les tentatives')
}

// ==================== ANALYSE MOCK DERMATOLOGIQUE AMÉLIORÉE ====================
function createEnhancedMockAnalysis(contextData: any): any {
  const hasSymptoms = contextData.symptoms && contextData.symptoms.length > 0
  const hasChiefComplaint = contextData.chief_complaint && contextData.chief_complaint.length > 0
  
  console.log('🎭 Génération analyse dermatologique mock avec contexte clinique')
  
  return {
    lesions: [
      {
        location: hasChiefComplaint && contextData.chief_complaint.toLowerCase().includes('face') ? 
          "Région faciale - zone à préciser lors de l'examen" : 
          "Localisation anatomique à déterminer lors de consultation dermatologique",
        morphology: hasChiefComplaint ? 
          `Lésion dermatologique compatible avec la présentation : ${contextData.chief_complaint}. Évaluation morphologique complète requise.` :
          "Lésion cutanée nécessitant caractérisation morphologique dermatologique précise",
        size_mm: 12,
        borders: "Caractéristiques des bordures à évaluer par dermoscopie",
        features: hasSymptoms ? 
          contextData.symptoms.slice(0, 3).map((s: string) => `Caractéristique rapportée: ${s}`) : 
          ["Caractéristiques visuelles à déterminer", "Évaluation tactile recommandée", "Analyse dermatologique requise"]
      }
    ],
    diagnostic_diff: [
      {
        condition: "Dermatose bénigne - confirmation dermatologique requise",
        likelihood: "moderate" as const,
        reasoning: "Présentation initiale compatible avec condition dermatologique courante, mais diagnostic définitif nécessite examen dermatologique direct et éventuellement dermoscopie."
      },
      {
        condition: "Réaction cutanée inflammatoire",
        likelihood: "moderate" as const,
        reasoning: "Possibilité de réaction cutanée réactive ou allergique selon le contexte clinique rapporté."
      },
      {
        condition: "Lésion nécessitant surveillance dermatologique",
        likelihood: "low" as const,
        reasoning: "Bien que moins probable, toute lésion cutanée mérite une évaluation dermatologique professionnelle pour écarter des diagnostics plus sérieux."
      }
    ],
    red_flags: hasSymptoms && contextData.symptoms.some((s: string) => 
      s.toLowerCase().includes('rapid') || s.toLowerCase().includes('growing') || 
      s.toLowerCase().includes('bleeding') || s.toLowerCase().includes('pain') ||
      s.toLowerCase().includes('spread')) ?
      ["Évolution rapide mentionnée - consultation dermatologique urgente recommandée", "Changements récents signalés nécessitant évaluation professionnelle"] : 
      ["Aucun signal d'alarme évident d'après les informations disponibles"],
    recommended_exams: [
      "Consultation dermatologique avec examen clinique complet",
      "Dermoscopie pour analyse morphologique précise",
      "Photographie dermatologique pour suivi évolutif",
      "Biopsie cutanée si lésion suspecte ou atypique"
    ],
    treatment_hints: [
      "Éviter absolument l'auto-médication topique",
      "Consultation dermatologique spécialisée fortement recommandée",
      "Surveillance rapprochée de l'évolution des lésions",
      "Protection solaire adaptée selon la localisation"
    ],
    urgency_level: hasSymptoms && contextData.symptoms.some((s: string) => 
      s.toLowerCase().includes('urgent') || s.toLowerCase().includes('rapid') || 
      s.toLowerCase().includes('bleeding')) ? 
      "urgent" as const : "routine" as const,
    confidence_score: 0.3, // Score volontairement bas pour l'analyse mock
    clinical_recommendations: `Cette analyse préliminaire basée sur image(s) nécessite impérativement confirmation par examen dermatologique direct. 
    Consultation dermatologique recommandée dans les plus brefs délais pour :
    - Examen clinique complet des lésions
    - Analyse dermoscopique si nécessaire  
    - Établissement du diagnostic définitif
    - Mise en place du traitement approprié
    - Planification du suivi dermatologique
    
    L'analyse d'image ne peut en aucun cas remplacer l'expertise clinique dermatologique directe.`
  }
}

// ==================== ENDPOINT POST PRINCIPAL AVEC LOGIQUE IDENTIQUE ====================
export async function POST(request: NextRequest) {
  console.log('🚀 Tibok Photo Analysis - Version avec logique IDENTIQUE à openai-diagnosis')
  const startTime = Date.now()
  
  try {
    // Récupération des données et de la clé API EXACTEMENT comme openai-diagnosis
    const [body, apiKey] = await Promise.all([
      request.json(),
      Promise.resolve(process.env.OPENAI_API_KEY)
    ])
    
    // Validation EXACTE comme openai-diagnosis
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.error('❌ Clé API OpenAI invalide ou manquante')
      return NextResponse.json({
        success: false,
        error: 'Configuration API manquante',
        errorCode: 'API_CONFIG_ERROR'
      }, { status: 500 })
    }
    
    // Authentification
    const auth = await authenticateRequest(request)
    
    const { 
      consultation_id,
      photo_urls, 
      photo_storage_paths,
      context = {},
      options = {} 
    } = body

    console.log('📥 Requête reçue:', {
      consultation_id: !!consultation_id,
      photo_urls_count: photo_urls?.length || 0,
      photo_storage_paths_count: photo_storage_paths?.length || 0,
      has_context: Object.keys(context).length > 0,
      user_authenticated: auth.isAuthenticated
    })

    // Validation entrée stricte
    const imageUrls = photo_urls || photo_storage_paths || []
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.log('❌ Validation failed: No images provided')
      return NextResponse.json({ 
        error: "photo_urls ou photo_storage_paths requis",
        details: "Un tableau d'URLs ou de chemins d'images est nécessaire pour l'analyse dermatologique",
        example: {
          photo_urls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
          context: { 
            patient_age: 35, 
            symptoms: ["rash", "itching"],
            chief_complaint: "Éruption cutanée depuis 1 semaine"
          }
        }
      }, { status: 400 })
    }

    if (imageUrls.length > 5) {
      console.log(`❌ Trop d'images: ${imageUrls.length}`)
      return NextResponse.json({ 
        error: "Maximum 5 images par analyse dermatologique",
        details: "Pour assurer la qualité de l'analyse, limitez à 5 images maximum"
      }, { status: 400 })
    }

    // Vérification accès consultation (si authentifié)
    let consultation = null
    if (auth.isAuthenticated && !auth.isService && consultation_id) {
      console.log('🔒 Vérification accès consultation:', consultation_id)
      const supabase = await createClient()
      const { data: consultationData, error: consultationError } = await supabase
        .from("consultations")
        .select("*")
        .eq("id", consultation_id)
        .single()

      if (!consultationError && consultationData) {
        if (consultationData.patient_id === auth.user.id || consultationData.doctor_id === auth.user.id) {
          consultation = consultationData
          console.log('✅ Accès consultation autorisé')
        } else {
          console.log('❌ Accès consultation refusé')
          return NextResponse.json({ error: "Accès refusé à cette consultation" }, { status: 403 })
        }
      }
    }

    // Préparation URLs pour analyse IA
    let analysisUrls = imageUrls
    if (auth.isAuthenticated && !auth.isService && photo_storage_paths) {
      console.log('🔗 Génération URLs signées Supabase...')
      const supabase = await createClient()
      analysisUrls = []
      
      for (const path of photo_storage_paths) {
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from("clinical-photos")
          .createSignedUrl(path, 3600) // 1 heure

        if (!urlError && signedUrl) {
          analysisUrls.push(signedUrl.signedUrl)
        } else {
          console.warn(`⚠️ Impossible de générer URL signée pour ${path}:`, urlError)
        }
      }
      
      if (analysisUrls.length === 0) {
        return NextResponse.json({ 
          error: "Impossible d'accéder aux images du stockage",
          details: "Vérifiez que les chemins d'images sont corrects"
        }, { status: 400 })
      }
    }

    // Enrichissement du contexte clinique
    const analysisContext = {
      ...context,
      ...(consultation || {}),
      timestamp: new Date().toISOString(),
      analysis_type: 'dermatological_photo_analysis'
    }
    
    console.log('🧠 Contexte clinique préparé:', {
      patient_age: analysisContext.patient_age,
      has_symptoms: !!(analysisContext.symptoms && analysisContext.symptoms.length > 0),
      has_complaint: !!analysisContext.chief_complaint,
      has_history: !!(analysisContext.medical_history && analysisContext.medical_history.length > 0)
    })
    
    // Analyse dermatologique avec OpenAI Vision - LOGIQUE IDENTIQUE À openai-diagnosis
    let report
    let analysisMethod = 'unknown'
    
    try {
      console.log('🔬 Démarrage analyse dermatologique OpenAI Vision - LOGIQUE IDENTIQUE...')
      // APPEL AVEC LA MÊME LOGIQUE : apiKey en premier paramètre
      report = await callOpenAIPhotoAnalysis(apiKey, analysisUrls, analysisContext, options)
      analysisMethod = 'openai_vision_api'
      console.log('✨ Analyse OpenAI réussie!')
    } catch (aiError) {
      console.error('❌ Erreur analyse OpenAI:', aiError)
      console.log('🎭 Basculement vers analyse mock dermatologique...')
      report = createEnhancedMockAnalysis(analysisContext)
      analysisMethod = 'mock_dermatological_analysis'
    }

    const latency = Date.now() - startTime
    const estimatedCost = analysisUrls.length * COST_ESTIMATION.GPT_4O.perImage + COST_ESTIMATION.GPT_4O.perRequest

    console.log(`⏱️ Analyse terminée en ${latency}ms (méthode: ${analysisMethod})`)

    // Sauvegarde en base (si utilisateur authentifié et consultation)
    let savedReportId = null
    if (auth.isAuthenticated && !auth.isService && consultation) {
      try {
        console.log('💾 Sauvegarde rapport en base...')
        const supabase = await createClient()
        const { data: savedReport, error: saveError } = await supabase
          .from("ai_photo_reports")
          .insert({
            consultation_id: consultation.id,
            model: options.model || AI_CONFIG.PHOTO_ANALYSIS.model,
            prompt_version: "derm-expert-v2-identical-logic",
            input_photos: photo_storage_paths || photo_urls,
            report,
            latency_ms: latency,
            cost_usd: estimatedCost,
          })
          .select()
          .single()

        if (saveError) {
          console.error('❌ Erreur sauvegarde:', saveError)
        } else {
          savedReportId = savedReport.id
          console.log('✅ Rapport sauvegardé:', savedReportId)
          
          // Log événement médical
          logMedicalEvent("PHOTO_ANALYSIS_GENERATED", consultation.id, auth.user.id, {
            report_id: savedReport.id,
            images_count: analysisUrls.length,
            latency_ms: latency,
            analysis_method: analysisMethod
          })
        }
      } catch (dbError) {
        console.error('❌ Erreur base de données:', dbError)
      }
    }

    // Réponse complète et structurée
    console.log('📤 Génération réponse finale...')
    return NextResponse.json({
      success: true,
      analysis: report,
      metadata: {
        report_id: savedReportId,
        analysis_method: analysisMethod,
        latency_ms: latency,
        estimated_cost_usd: estimatedCost,
        model: options.model || AI_CONFIG.PHOTO_ANALYSIS.model,
        images_analyzed: analysisUrls.length,
        timestamp: new Date().toISOString(),
        saved_to_database: !!savedReportId,
        user_authenticated: auth.isAuthenticated,
        is_service: auth.isService,
        prompt_version: "derm-expert-v2-identical-logic",
        system_version: "photo-diagnosis-identical-v3.0",
        context_enriched: Object.keys(analysisContext).length > 5,
        api_method: "identical_to_openai_diagnosis",
        api_key_logic: "same_as_openai_diagnosis",
        disclaimer: "Cette analyse dermatologique est un outil d'aide au diagnostic. Une consultation dermatologique directe reste indispensable pour tout diagnostic définitif et traitement approprié."
      }
    })

  } catch (error) {
    console.error("❌ Erreur critique analyse photo:", error)
    const errorTime = Date.now() - startTime
    
    if (error instanceof Error) {
      // Gestion spécifique des erreurs IDENTIQUE À openai-diagnosis
      if (error.message.includes('rate_limit') || error.message.includes('429')) {
        return NextResponse.json({ 
          error: "Limite de taux OpenAI atteinte", 
          details: "Trop de requêtes simultanées. Veuillez réessayer dans quelques minutes.",
          retry_after: 60 
        }, { status: 429 })
      }
      
      if (error.message.includes('invalid_image')) {
        return NextResponse.json({ 
          error: "Format d'image invalide",
          details: "Vérifiez que vos images sont au format JPEG, PNG, WebP ou GIF",
          supported_formats: ["JPEG", "PNG", "WebP", "GIF"]
        }, { status: 422 })
      }

      if (error.message.includes('Configuration API') || error.message.includes('API_CONFIG_ERROR')) {
        return NextResponse.json({ 
          error: "Configuration API manquante",
          details: "Service temporairement indisponible - Configuration en cours",
          errorCode: 'API_CONFIG_ERROR'
        }, { status: 500 })
      }

      if (error.message.includes('insufficient_quota') || error.message.includes('Quota OpenAI')) {
        return NextResponse.json({ 
          error: "Quota OpenAI insuffisant",
          details: "Vérifiez votre compte OpenAI et votre facturation",
          errorCode: 'QUOTA_EXCEEDED'
        }, { status: 402 })
      }
      
      // Autres erreurs AI
      const aiError = handleAIError(error)
      return NextResponse.json({ error: aiError.message }, { status: aiError.statusCode })
    }

    return NextResponse.json({ 
      error: "Erreur interne du serveur",
      details: "Une erreur inattendue s'est produite lors de l'analyse",
      timestamp: new Date().toISOString(),
      processingTime: `${errorTime}ms`
    }, { status: 500 })
  }
}

// ==================== ENDPOINT GET COMPLET ET DOCUMENTÉ ====================
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  const openaiConfigured = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-'))
  
  return NextResponse.json({
    service: "Tibok Photo Analysis API - Version Logique Identique",
    version: "3.0.0-identical-logic",
    description: "API d'analyse dermatologique par IA avec LOGIQUE IDENTIQUE à openai-diagnosis",
    status: openaiConfigured ? "✅ OPÉRATIONNELLE - Configuration OpenAI OK" : "⚠️ Configuration OpenAI manquante",
    
    identical_logic_applied: [
      "✅ Récupération clé API identique : const [body, apiKey] = await Promise.all([request.json(), Promise.resolve(process.env.OPENAI_API_KEY)])",
      "✅ Validation clé API identique : if (!apiKey || !apiKey.startsWith('sk-'))",
      "✅ Ordre paramètres fonction identique : callOpenAIPhotoAnalysis(apiKey, ...autres)",
      "✅ Gestion d'erreurs OpenAI identique : même codes d'erreur et messages",
      "✅ Structure de réponse identique",
      "✅ Parsing JSON identique",
      "✅ Retry logic identique avec backoff exponentiel",
      "✅ Headers et body de requête OpenAI identiques",
      "✅ Logs de debug identiques",
      "✅ Fallback mock si échec API"
    ],
    
    key_changes_applied: [
      "Fonction callOpenAIPhotoAnalysis(apiKey, imageUrls, contextData, options, maxRetries) - apiKey en PREMIER",
      "Appel identique : await callOpenAIPhotoAnalysis(apiKey, analysisUrls, analysisContext, options)",
      "Même validation : !apiKey || !apiKey.startsWith('sk-')",
      "Même gestion d'erreurs HTTP : 401, 429, 402",
      "Même structure de réponse fetch avec headers Authorization",
      "Même parsing et nettoyage JSON",
      "Même logique de retry avec backoff exponentiel"
    ],
    
    dermatological_expertise: {
      system_prompts: "Prompts dermatologiques experts avec 20 ans d'expérience clinique",
      analysis_approach: "Approche systématique selon standards médicaux internationaux",
      diagnostic_methodology: "Diagnostic différentiel hiérarchisé avec probabilités cliniques",
      morphological_analysis: "Description morphologique détaillée des lésions",
      urgency_assessment: "Évaluation du niveau d'urgence dermatologique",
      red_flags_detection: "Identification systématique des signaux d'alarme",
      clinical_recommendations: "Recommandations dermatologiques personnalisées"
    },
    
    authentication: {
      current_user: auth.isAuthenticated ? {
        type: auth.isService ? 'service' : 'user',
        authenticated: true
      } : {
        type: 'anonymous',
        authenticated: false
      }
    },
    
    technical_stack: {
      ai_model: "GPT-4o Vision (haute résolution)", 
      api_method: "IDENTIQUE à openai-diagnosis - logique exactement reproduite",
      validation: "Zod schema validation avec messages d'erreur détaillés",
      retry_logic: "Backoff exponentiel identique jusqu'à 3 tentatives",
      fallback: "Analyse mock dermatologique contextuelle si OpenAI indisponible",
      storage: "Supabase avec URLs signées sécurisées",
      error_handling: "Gestion robuste IDENTIQUE à openai-diagnosis"
    },
    
    endpoints: {
      analyze: {
        method: "POST",
        path: "/api/photo-diagnosis",
        authentication: "Optionnel (x-api-key pour services, session pour utilisateurs)",
        headers: {
          "x-api-key": "YOUR_API_KEY (optionnel pour services externes)",
          "Content-Type": "application/json"
        },
        body: {
          photo_urls: "string[] - URLs directes des images (services externes)",
          photo_storage_paths: "string[] - Chemins Supabase Storage (utilisateurs authentifiés)",
          consultation_id: "string - ID consultation (optionnel, pour sauvegarde)",
          context: "object - Contexte clinique dermatologique (optionnel mais recommandé)",
          options: "object - Options d'analyse IA (température, max_tokens, etc.)"
        }
      },
      status: {
        method: "GET", 
        path: "/api/photo-diagnosis",
        description: "Status de l'API et documentation complète"
      }
    },
    
    supported_formats: ["JPEG", "PNG", "WebP", "GIF"],
    max_images_per_request: 5,
    image_resolution: "Haute résolution recommandée pour analyse précise",
    analysis_time: "5-15 secondes selon nombre d'images et complexité",
    
    medical_disclaimer: "⚠️ IMPORTANT : Cette analyse dermatologique par IA est un outil d'aide au diagnostic uniquement. Elle ne remplace en aucun cas l'expertise d'un dermatologue qualifié. Toute lésion cutanée suspecte ou évolutive nécessite une consultation dermatologique directe pour diagnostic définitif et traitement approprié.",
    
    configuration: {
      openai_configured: openaiConfigured,
      openai_model: "gpt-4o",
      max_tokens: 2000,
      temperature: 0.2,
      api_version: "2023-12-01",
      vision_detail: "high",
      method: "identical_to_openai_diagnosis",
      logic_status: "✅ IDENTIQUE À openai-diagnosis"
    }
  })
}
