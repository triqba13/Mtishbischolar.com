-- ============================================================================
-- MTISHBISCHOLARS MIGRATION: ADD OFFICER PRESENCE & HEARTBEAT TRACKING
-- Target Project: https://qjhggpmbuqnywjlrvfif.supabase.co
-- ============================================================================

-- 1. ADD last_seen_at COLUMN TO public.profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- 2. CREATE INDEX FOR FAST PRESENCE LOOKUPS
CREATE INDEX IF NOT EXISTS idx_profiles_role_last_seen
  ON public.profiles(role, last_seen_at);

-- 3. RLS POLICIES FOR OFFICER HEARTBEAT
-- Allow authenticated users to update their own last_seen_at timestamp
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can update own last_seen_at" ON public.profiles;
  CREATE POLICY "Users can update own last_seen_at"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

-- Allow authenticated users to view public profile info of officers
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can view officer profiles" ON public.profiles;
  CREATE POLICY "Authenticated users can view officer profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
      id = auth.uid() 
      OR role IN ('admission_officer', 'finance_officer', 'super_admin')
    );
EXCEPTION
  WHEN undefined_table THEN null;
END $$;
