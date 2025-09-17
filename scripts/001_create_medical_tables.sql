-- Create tables for the Tibok photo diagnostic module
-- Based on the technical specification document

-- Table for storing consultation state (clinical data)
CREATE TABLE IF NOT EXISTS consultations_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  clinical_text JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for storing clinical photos
CREATE TABLE IF NOT EXISTS clinical_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/webp',
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  sha256 TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for AI photo analysis reports
CREATE TABLE IF NOT EXISTS ai_photo_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  prompt_version TEXT NOT NULL DEFAULT 'derm-v1',
  input_photos JSONB NOT NULL DEFAULT '[]',
  report JSONB NOT NULL DEFAULT '{}',
  latency_ms INTEGER,
  cost_usd NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for AI diagnosis reports
CREATE TABLE IF NOT EXISTS ai_diagnosis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  prompt_version TEXT NOT NULL DEFAULT 'dx-v1',
  input_refs JSONB NOT NULL DEFAULT '{}',
  report JSONB NOT NULL DEFAULT '{}',
  latency_ms INTEGER,
  cost_usd NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE consultations_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_photo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_diagnosis_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consultations_state
CREATE POLICY "consultations_state_select" ON consultations_state
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id = consultation_id 
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

CREATE POLICY "consultations_state_insert" ON consultations_state
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id = consultation_id 
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

CREATE POLICY "consultations_state_update" ON consultations_state
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id = consultation_id 
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

-- RLS Policies for clinical_photos
CREATE POLICY "clinical_photos_select" ON clinical_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id = consultation_id 
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

CREATE POLICY "clinical_photos_insert" ON clinical_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id = consultation_id 
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

CREATE POLICY "clinical_photos_delete" ON clinical_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id = consultation_id 
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

-- RLS Policies for ai_photo_reports
CREATE POLICY "ai_photo_reports_select" ON ai_photo_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id = consultation_id 
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

CREATE POLICY "ai_photo_reports_insert" ON ai_photo_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id = consultation_id 
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

-- RLS Policies for ai_diagnosis_reports
CREATE POLICY "ai_diagnosis_reports_select" ON ai_diagnosis_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id = consultation_id 
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

CREATE POLICY "ai_diagnosis_reports_insert" ON ai_diagnosis_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id = consultation_id 
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultations_state_consultation_id ON consultations_state(consultation_id);
CREATE INDEX IF NOT EXISTS idx_clinical_photos_consultation_id ON clinical_photos(consultation_id);
CREATE INDEX IF NOT EXISTS idx_ai_photo_reports_consultation_id ON ai_photo_reports(consultation_id);
CREATE INDEX IF NOT EXISTS idx_ai_diagnosis_reports_consultation_id ON ai_diagnosis_reports(consultation_id);
