-- ============================================================================
-- MTISHBISCHOLARS SECURE SUPABASE MIGRATION SCRIPT (REVISED)
-- Target Project: https://qjhggpmbuqnywjlrvfif.supabase.co
-- ============================================================================

-- 1. ADD MISSING COLUMNS TO public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  ADD COLUMN IF NOT EXISTS dob TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS highest_education TEXT,
  ADD COLUMN IF NOT EXISTS o_level_school TEXT,
  ADD COLUMN IF NOT EXISTS o_level_year TEXT,
  ADD COLUMN IF NOT EXISTS a_level_school TEXT,
  ADD COLUMN IF NOT EXISTS a_level_year TEXT,
  ADD COLUMN IF NOT EXISTS a_level_combination TEXT,
  ADD COLUMN IF NOT EXISTS has_passport TEXT,
  ADD COLUMN IF NOT EXISTS passport_number TEXT,
  ADD COLUMN IF NOT EXISTS passport_issue_date TEXT,
  ADD COLUMN IF NOT EXISTS passport_expiry_date TEXT,
  ADD COLUMN IF NOT EXISTS applied_abroad_before TEXT,
  ADD COLUMN IF NOT EXISTS how_did_you_hear TEXT,
  ADD COLUMN IF NOT EXISTS need_financial_guidance TEXT,
  ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT false;

-- 2. ADD MISSING COLUMNS TO public.applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS target_intake TEXT,
  ADD COLUMN IF NOT EXISTS preferred_course TEXT;

-- 3. PROVISION PRIVATE BUCKET IN storage.buckets FOR student-documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  false, -- PRIVATE BUCKET FOR SENSITIVE ACADEMIC DOCUMENTS
  10485760, -- 10MB FILE SIZE LIMIT
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

-- 4. CREATE SECURITY DEFINER RPC FUNCTION FOR AUTHENTICATED USERS
CREATE OR REPLACE FUNCTION public.provision_student_documents_bucket()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'student-documents',
    'student-documents',
    false, -- PRIVATE BUCKET
    10485760,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
  )
  ON CONFLICT (id) DO UPDATE SET 
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
END;
$$;

-- RESTRICT EXECUTION TO AUTHENTICATED USERS & SERVICE ROLE ONLY (REVOKE ANON)
REVOKE EXECUTE ON FUNCTION public.provision_student_documents_bucket() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.provision_student_documents_bucket() TO authenticated, service_role;

-- 5. STORAGE RLS POLICIES FOR PRIVATE student-documents BUCKET
DO $$ BEGIN
    CREATE POLICY "Students can upload own documents"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Students can read own documents"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Students can update own documents"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Students can delete own documents"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. REFRESH POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
