-- ============================================================================
-- MTISHBISCHOLARS SUPABASE MIGRATION SCRIPT
-- Migration: Add Dynamic Academic Profile Fields
-- Target Project: https://qjhggpmbuqnywjlrvfif.supabase.co
-- ============================================================================

-- 1. ADD DYNAMIC ACADEMIC COLUMNS TO public.profiles
ALTER TABLE public.profiles
  -- Certificate Fields
  ADD COLUMN IF NOT EXISTS certificate_institution TEXT,
  ADD COLUMN IF NOT EXISTS certificate_course TEXT,
  ADD COLUMN IF NOT EXISTS certificate_year TEXT,

  -- Diploma Fields
  ADD COLUMN IF NOT EXISTS diploma_institution TEXT,
  ADD COLUMN IF NOT EXISTS diploma_course TEXT,
  ADD COLUMN IF NOT EXISTS diploma_year TEXT,

  -- Bachelor's Degree Fields
  ADD COLUMN IF NOT EXISTS bachelor_institution TEXT,
  ADD COLUMN IF NOT EXISTS bachelor_course TEXT,
  ADD COLUMN IF NOT EXISTS bachelor_year TEXT,

  -- Master's Degree Fields
  ADD COLUMN IF NOT EXISTS master_institution TEXT,
  ADD COLUMN IF NOT EXISTS master_course TEXT,
  ADD COLUMN IF NOT EXISTS master_year TEXT,

  -- PhD Fields
  ADD COLUMN IF NOT EXISTS phd_institution TEXT,
  ADD COLUMN IF NOT EXISTS phd_course TEXT,
  ADD COLUMN IF NOT EXISTS phd_year TEXT;

-- 2. REFRESH POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
