-- ============================================================================
-- MTISHBISCHOLARS MIGRATION: PASSPORT ASSISTANCE MODULE
-- Dedicated table, RLS policies, and supporting document types for passport assistance
-- Target Project: https://qjhggpmbuqnywjlrvfif.supabase.co
-- ============================================================================

-- 1. CREATE TABLE public.passport_assistance
CREATE TABLE IF NOT EXISTS public.passport_assistance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- SECTION 1: TAARIFA ZA MWOMBAJI / APPLICANT INFORMATION
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  date_of_birth TEXT,
  birth_country TEXT,
  birth_region TEXT,
  birth_district TEXT,
  birth_ward TEXT,
  birth_village_street TEXT,
  sex TEXT,
  marital_status TEXT,
  student_postal_address TEXT,
  email TEXT,
  phone_number TEXT,

  -- SECTION 2: ANAPOISHI/MAKAZI / CURRENT RESIDENCE
  residence_country TEXT,
  residence_region TEXT,
  residence_district TEXT,
  residence_ward TEXT,
  residence_street_village TEXT,
  residence_house_number TEXT,

  -- SECTION 3: TAARIFA ZA BABA / FATHER'S INFORMATION
  father_full_name TEXT,
  father_occupation TEXT,
  father_dob TEXT,
  father_birth_country TEXT,
  father_birth_region TEXT,
  father_birth_district TEXT,
  father_birth_ward_shehia TEXT,
  father_birth_street_village TEXT,

  -- SECTION 4: TAARIFA ZA MAMA / MOTHER'S INFORMATION
  mother_full_name TEXT,
  mother_occupation TEXT,
  mother_dob TEXT,
  mother_birth_country TEXT,
  mother_birth_region TEXT,
  mother_birth_district TEXT,
  mother_birth_ward_shehia TEXT,
  mother_birth_street_village TEXT,

  -- WORKFLOW & STATUS FIELDS
  assistance_status TEXT NOT NULL DEFAULT 'form_pending', -- 'form_pending', 'form_completed', 'documents_pending', 'in_progress', 'ready_for_submission', 'submitted_to_immigration', 'passport_issued'
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'pending_verification', 'paid'
  payment_amount NUMERIC(10,2) DEFAULT 300000,
  payment_currency TEXT DEFAULT 'TZS',
  payment_method TEXT,
  payment_ref TEXT,
  payment_proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. CREATE INDEX FOR FASTER STUDENT LOOKUPS
CREATE INDEX IF NOT EXISTS idx_passport_assistance_student_id
  ON public.passport_assistance(student_id);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.passport_assistance ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR public.passport_assistance

-- SELECT Policy
DO $$ BEGIN
  DROP POLICY IF EXISTS "Students and staff view passport assistance" ON public.passport_assistance;
  CREATE POLICY "Students and staff view passport assistance"
    ON public.passport_assistance FOR SELECT
    TO authenticated
    USING (
      student_id = auth.uid()
      OR get_auth_user_role() = ANY (ARRAY['admission_officer'::text, 'finance_officer'::text, 'super_admin'::text])
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role::text IN ('admission_officer', 'finance_officer', 'super_admin', 'Super Admin', 'Admission Officer', 'Finance Officer')
      )
    );
END $$;

-- INSERT Policy
DO $$ BEGIN
  DROP POLICY IF EXISTS "Students and staff insert passport assistance" ON public.passport_assistance;
  CREATE POLICY "Students and staff insert passport assistance"
    ON public.passport_assistance FOR INSERT
    TO authenticated
    WITH CHECK (
      student_id = auth.uid()
      OR get_auth_user_role() = ANY (ARRAY['admission_officer'::text, 'finance_officer'::text, 'super_admin'::text])
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role::text IN ('admission_officer', 'finance_officer', 'super_admin', 'Super Admin', 'Admission Officer', 'Finance Officer')
      )
    );
END $$;

-- UPDATE Policy
DO $$ BEGIN
  DROP POLICY IF EXISTS "Students and staff update passport assistance" ON public.passport_assistance;
  CREATE POLICY "Students and staff update passport assistance"
    ON public.passport_assistance FOR UPDATE
    TO authenticated
    USING (
      student_id = auth.uid()
      OR get_auth_user_role() = ANY (ARRAY['admission_officer'::text, 'finance_officer'::text, 'super_admin'::text])
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role::text IN ('admission_officer', 'finance_officer', 'super_admin', 'Super Admin', 'Admission Officer', 'Finance Officer')
      )
    )
    WITH CHECK (
      student_id = auth.uid()
      OR get_auth_user_role() = ANY (ARRAY['admission_officer'::text, 'finance_officer'::text, 'super_admin'::text])
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role::text IN ('admission_officer', 'finance_officer', 'super_admin', 'Super Admin', 'Admission Officer', 'Finance Officer')
      )
    );
END $$;

-- DELETE Policy (Super Admin only)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff delete passport assistance" ON public.passport_assistance;
  CREATE POLICY "Staff delete passport assistance"
    ON public.passport_assistance FOR DELETE
    TO authenticated
    USING (
      get_auth_user_role() = 'super_admin'::text
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role::text IN ('super_admin', 'Super Admin')
      )
    );
END $$;
