-- ============================================================================
-- Migration: 20260828000002_audit_logs_staff_policy.sql
-- Description: Adds SELECT RLS policies on public.audit_logs for staff roles (finance_officer, admission_officer, super_admin).
-- Ensures immutable append-only trail with zero student access.
-- ============================================================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if any conflict
DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff can view audit logs" ON public.audit_logs;
  DROP POLICY IF EXISTS "Staff and students view audit logs" ON public.audit_logs;
  
  -- 3. Policy: Only staff (finance_officer, admission_officer, super_admin) can view audit logs
  CREATE POLICY "Staff can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
      public.get_auth_user_role() IN ('finance_officer', 'admission_officer', 'super_admin')
    );
END $$;

-- 4. Notify PostgREST schema reload
NOTIFY pgrst, 'reload schema';
