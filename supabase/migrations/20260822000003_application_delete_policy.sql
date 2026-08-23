-- ==============================================================================
-- MTISHBISCHOLAR: APPLICATION DELETE / WITHDRAW RLS POLICY MIGRATION
-- Allow students to permanently delete/withdraw their own applications in allowed stages:
-- 'Profile Completed', 'Under Review', 'Submitted to University'
-- Protected stages ('University Offer Issued', 'Visa Approved') cannot be deleted by students.
-- ==============================================================================

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Students can delete own draft applications" ON public.applications;
  DROP POLICY IF EXISTS "Students can delete own applications" ON public.applications;
  DROP POLICY IF EXISTS "Students can delete own eligible applications" ON public.applications;
  
  CREATE POLICY "Students can delete own eligible applications"
    ON public.applications FOR DELETE
    TO authenticated
    USING (
      auth.uid() = student_id 
      AND status IN ('Profile Completed', 'Under Review', 'Submitted to University')
    );
END $$;
