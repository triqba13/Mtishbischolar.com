-- ============================================================================
-- MTISHBISCHOLAR: STAFF ROLE-BASED RLS POLICIES MIGRATION
-- Version: 1.0 (Production Safe & Idempotent)
-- Target Project: https://qjhggpmbuqnywjlrvfif.supabase.co
-- ============================================================================

-- 1. SECURITY DEFINER HELPER FUNCTION (Prevents Recursive RLS)
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- Restrict function execution to authenticated users and service role
REVOKE EXECUTE ON FUNCTION public.get_auth_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO authenticated, service_role;


-- 2. PUBLIC.PROFILES STAFF ACCESS
-- Allow staff (admission_officer, finance_officer, super_admin) to view profiles for operational needs
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Staff and users can view profiles" ON public.profiles;
  
  CREATE POLICY "Staff and users can view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
      auth.uid() = id 
      OR public.get_auth_user_role() IN ('admission_officer', 'finance_officer', 'super_admin')
    );
END $$;


-- 3. PUBLIC.APPLICATIONS STAFF ACCESS
-- Admission officers and Super admins can read and update all applications
DO $$ BEGIN
  DROP POLICY IF EXISTS "Students view own applications" ON public.applications;
  DROP POLICY IF EXISTS "Staff and students view applications" ON public.applications;
  
  CREATE POLICY "Staff and students view applications"
    ON public.applications FOR SELECT
    TO authenticated
    USING (
      auth.uid() = student_id 
      OR public.get_auth_user_role() IN ('admission_officer', 'super_admin')
    );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Students update own applications" ON public.applications;
  DROP POLICY IF EXISTS "Staff and students update applications" ON public.applications;
  
  CREATE POLICY "Staff and students update applications"
    ON public.applications FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = student_id 
      OR public.get_auth_user_role() IN ('admission_officer', 'super_admin')
    );
END $$;


-- 4. PUBLIC.DOCUMENTS STAFF ACCESS
-- Admission officers and Super admins can read and update document verification
DO $$ BEGIN
  DROP POLICY IF EXISTS "Students view own documents" ON public.documents;
  DROP POLICY IF EXISTS "Staff and students view documents" ON public.documents;
  
  CREATE POLICY "Staff and students view documents"
    ON public.documents FOR SELECT
    TO authenticated
    USING (
      auth.uid() = student_id 
      OR public.get_auth_user_role() IN ('admission_officer', 'super_admin')
    );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff update documents verification" ON public.documents;
  
  CREATE POLICY "Staff update documents verification"
    ON public.documents FOR UPDATE
    TO authenticated
    USING (
      public.get_auth_user_role() IN ('admission_officer', 'super_admin')
    );
END $$;


-- 5. PUBLIC.PAYMENTS STAFF ACCESS
-- Finance officers and Super admins can view all payments and update verification
DO $$ BEGIN
  DROP POLICY IF EXISTS "Students view own payments" ON public.payments;
  DROP POLICY IF EXISTS "Staff and students view payments" ON public.payments;
  
  CREATE POLICY "Staff and students view payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
      auth.uid() = student_id 
      OR public.get_auth_user_role() IN ('finance_officer', 'super_admin')
    );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff update payments verification" ON public.payments;
  
  CREATE POLICY "Staff update payments verification"
    ON public.payments FOR UPDATE
    TO authenticated
    USING (
      public.get_auth_user_role() IN ('finance_officer', 'super_admin')
    );
END $$;


-- 6. STORAGE OBJECTS (student-documents PRIVATE BUCKET)
-- Admission officers and Super admins can view uploaded student documents in storage
DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff can read student documents" ON storage.objects;
  
  CREATE POLICY "Staff can read student documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'student-documents' 
      AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR public.get_auth_user_role() IN ('admission_officer', 'super_admin')
      )
    );
END $$;

-- 7. REFRESH POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
