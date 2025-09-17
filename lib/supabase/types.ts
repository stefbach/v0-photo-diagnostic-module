// lib/supabase/types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          user_type: 'patient' | 'doctor' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          user_type?: 'patient' | 'doctor' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          user_type?: 'patient' | 'doctor' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      consultations: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string | null
          patient_age: number | null
          patient_gender: string | null
          chief_complaint: string | null
          symptoms: string[] | null
          medical_history: string[] | null
          current_medications: string | null
          allergies: string | null
          consultation_reason: string | null
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id?: string | null
          patient_age?: number | null
          patient_gender?: string | null
          chief_complaint?: string | null
          symptoms?: string[] | null
          medical_history?: string[] | null
          current_medications?: string | null
          allergies?: string | null
          consultation_reason?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string | null
          patient_age?: number | null
          patient_gender?: string | null
          chief_complaint?: string | null
          symptoms?: string[] | null
          medical_history?: string[] | null
          current_medications?: string | null
          allergies?: string | null
          consultation_reason?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      ai_photo_reports: {
        Row: {
          id: string
          consultation_id: string
          model: string
          prompt_version: string
          input_photos: string[]
          report: Json
          latency_ms: number
          cost_usd: number
          created_at: string
        }
        Insert: {
          id?: string
          consultation_id: string
          model: string
          prompt_version: string
          input_photos: string[]
          report: Json
          latency_ms: number
          cost_usd: number
          created_at?: string
        }
        Update: {
          id?: string
          consultation_id?: string
          model?: string
          prompt_version?: string
          input_photos?: string[]
          report?: Json
          latency_ms?: number
          cost_usd?: number
          created_at?: string
        }
      }
      clinical_photos: {
        Row: {
          id: string
          consultation_id: string
          storage_path: string
          original_filename: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          consultation_id: string
          storage_path: string
          original_filename: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          consultation_id?: string
          storage_path?: string
          original_filename?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: 'patient' | 'doctor' | 'admin'
      consultation_status: 'active' | 'completed' | 'cancelled'
    }
  }
}
