-- ============================================================================
-- MTISHBISCHOLAR: PRODUCTION PERFORMANCE INDEXES MIGRATION
-- Phase: P0 Performance Optimization (Step 1)
-- Description: Justified B-Tree indexes matching existing query patterns
-- ============================================================================

-- 1. Applications Table Indexes
CREATE INDEX IF NOT EXISTS idx_applications_student_id 
  ON public.applications (student_id);

CREATE INDEX IF NOT EXISTS idx_applications_status 
  ON public.applications (status);

CREATE INDEX IF NOT EXISTS idx_applications_university_id 
  ON public.applications (university_id);

CREATE INDEX IF NOT EXISTS idx_applications_created_at_desc 
  ON public.applications (created_at DESC);

-- 2. Documents Table Indexes
CREATE INDEX IF NOT EXISTS idx_documents_student_id 
  ON public.documents (student_id);

CREATE INDEX IF NOT EXISTS idx_documents_application_id 
  ON public.documents (application_id);

CREATE INDEX IF NOT EXISTS idx_documents_type 
  ON public.documents (document_type);

CREATE INDEX IF NOT EXISTS idx_documents_is_verified 
  ON public.documents (is_verified);

-- 3. Payments Table Indexes
CREATE INDEX IF NOT EXISTS idx_payments_student_id 
  ON public.payments (student_id);

CREATE INDEX IF NOT EXISTS idx_payments_status 
  ON public.payments (status);

CREATE INDEX IF NOT EXISTS idx_payments_created_at_desc 
  ON public.payments (created_at DESC);

-- 4. Notifications Table Indexes (Composite for unread polling & list ordering)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created 
  ON public.notifications (user_id, is_read, created_at DESC);

-- 5. Profiles Table Indexes (For role lookups & passport tracking)
CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON public.profiles (role);

CREATE INDEX IF NOT EXISTS idx_profiles_has_passport 
  ON public.profiles (has_passport);
