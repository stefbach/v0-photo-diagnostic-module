-- Create storage bucket for clinical photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinical-photos',
  'clinical-photos',
  false,
  10485760, -- 10MB limit
  ARRAY['image/webp', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for storage bucket
CREATE POLICY "clinical_photos_storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'clinical-photos' AND
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id::text = split_part(name, '/', 1)
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

CREATE POLICY "clinical_photos_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'clinical-photos' AND
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id::text = split_part(name, '/', 1)
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

CREATE POLICY "clinical_photos_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'clinical-photos' AND
    EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.id::text = split_part(name, '/', 1)
      AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );
