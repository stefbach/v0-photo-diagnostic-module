// Error handling utilities for medical APIs

export class MedicalAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 500,
    public details?: any,
  ) {
    super(message)
    this.name = "MedicalAPIError"
  }
}

export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",
  ACCESS_DENIED: "ACCESS_DENIED",

  // Validation errors
  MISSING_PARAMETERS: "MISSING_PARAMETERS",
  INVALID_IMAGE: "INVALID_IMAGE",
  CONSULTATION_NOT_FOUND: "CONSULTATION_NOT_FOUND",

  // AI service errors
  AI_RATE_LIMIT: "AI_RATE_LIMIT",
  AI_TIMEOUT: "AI_TIMEOUT",
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",

  // Database errors
  DATABASE_ERROR: "DATABASE_ERROR",
  STORAGE_ERROR: "STORAGE_ERROR",

  // General errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const

export function handleAIError(error: Error): MedicalAPIError {
  if (error.message.includes("rate_limit") || error.message.includes("429")) {
    return new MedicalAPIError("Limite de taux atteinte, veuillez réessayer plus tard", ERROR_CODES.AI_RATE_LIMIT, 429)
  }

  if (error.message.includes("timeout") || error.message.includes("504")) {
    return new MedicalAPIError("Délai d'attente dépassé", ERROR_CODES.AI_TIMEOUT, 504)
  }

  if (error.message.includes("invalid_image") || error.message.includes("422")) {
    return new MedicalAPIError("Format d'image invalide", ERROR_CODES.INVALID_IMAGE, 422)
  }

  return new MedicalAPIError("Erreur du service IA", ERROR_CODES.AI_SERVICE_ERROR, 502, {
    originalError: error.message,
  })
}

export function handleDatabaseError(error: any): MedicalAPIError {
  console.error("Database error:", error)

  if (error.code === "PGRST116") {
    return new MedicalAPIError("Ressource non trouvée", ERROR_CODES.CONSULTATION_NOT_FOUND, 404)
  }

  if (error.code === "42501") {
    return new MedicalAPIError("Accès refusé", ERROR_CODES.ACCESS_DENIED, 403)
  }

  return new MedicalAPIError("Erreur de base de données", ERROR_CODES.DATABASE_ERROR, 500, {
    code: error.code,
    details: error.details,
  })
}

export function logMedicalEvent(event: string, consultationId: string, userId: string, metadata?: Record<string, any>) {
  // In production, this would send to a secure medical logging service
  console.log(`[MEDICAL_EVENT] ${event}`, {
    consultation_id: consultationId,
    user_id: userId,
    timestamp: new Date().toISOString(),
    metadata,
  })
}
