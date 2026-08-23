-- ============================================================================
-- MTISHBISCHOLARS MIGRATION: STUDENT CONTACTS (PARENT / GUARDIAN / SPONSOR)
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


-- 2. CREATE TABLE public.student_contacts
CREATE TABLE IF NOT EXISTS public.student_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (
    relationship_type IN (
      'Father',
      'Mother',
      'Sponsor',
      'Guardian',
      'Other'
    )
  ),
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CREATE INDEX FOR STUDENT LOOKUPS
CREATE INDEX IF NOT EXISTS idx_student_contacts_student_id
  ON public.student_contacts(student_id);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.student_contacts ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR public.student_contacts

-- Policy 1: SELECT (Students view own contacts; Admission Officers and Super Admins can view for admissions processing)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Students and staff view contacts" ON public.student_contacts;
  CREATE POLICY "Students and staff view contacts"
    ON public.student_contacts FOR SELECT
    TO authenticated
    USING (
      auth.uid() = student_id 
      OR public.get_auth_user_role() IN ('admission_officer', 'super_admin')
    );
END $$;

-- Policy 2: INSERT (Students can insert their own contacts)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Students can insert own contacts" ON public.student_contacts;
  CREATE POLICY "Students can insert own contacts"
    ON public.student_contacts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = student_id);
END $$;

-- Policy 3: UPDATE (Students can update own contacts; Admission Officers and Super Admins can update for verification)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Students and staff update contacts" ON public.student_contacts;
  CREATE POLICY "Students and staff update contacts"
    ON public.student_contacts FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = student_id 
      OR public.get_auth_user_role() IN ('admission_officer', 'super_admin')
    );
END $$;

-- Policy 4: DELETE (Students can delete their own contacts)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Students can delete own contacts" ON public.student_contacts;
  CREATE POLICY "Students can delete own contacts"
    ON public.student_contacts FOR DELETE
    TO authenticated
    USING (auth.uid() = student_id);
END $$;

-- 6. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
