// Type definitions for the medical photo diagnostic module

export interface ClinicalPhoto {
  id: string
  consultation_id: string
  storage_path: string
  mime_type: string
  width?: number
  height?: number
  file_size?: number
  sha256?: string
  created_by?: string
  created_at: string
}

export interface Lesion {
  location: string
  morphology: string
  size_mm?: number
  borders?: string
  features: string[]
}

export interface PhotoAnalysisReport {
  lesions: Lesion[]
  diagnostic_diff: string[]
  red_flags: string[]
  suggested_tests: string[]
  orientation: string
}

export interface AIPhotoReport {
  id: string
  consultation_id: string
  model: string
  prompt_version: string
  input_photos: string[]
  report: PhotoAnalysisReport
  latency_ms?: number
  cost_usd?: number
  created_at: string
}

export interface DiagnosticDifferential {
  label: string
  likelihood: "high" | "moderate" | "low"
}

export interface DiagnosisReport {
  diagnostic_diff: DiagnosticDifferential[]
  red_flags: string[]
  recommended_exams: string[]
  treatment_hints: string[]
  safety_net: string
  explainability: string
}

export interface AIDiagnosisReport {
  id: string
  consultation_id: string
  model: string
  prompt_version: string
  input_refs: {
    state_id?: string
    photo_report_id?: string
  }
  report: DiagnosisReport
  latency_ms?: number
  cost_usd?: number
  created_at: string
}

export interface ConsultationState {
  id: string
  consultation_id: string
  clinical_text: Record<string, any>
  created_at: string
  updated_at: string
}
