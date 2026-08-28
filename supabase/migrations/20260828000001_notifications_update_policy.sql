-- ============================================================================
-- Migration: 20260828000001_notifications_update_policy.sql
-- Description: Adds UPDATE and DELETE RLS policies for public.notifications so students can mark notifications as read and delete their own notifications.
-- ============================================================================

-- 1. Enable RLS on notifications table (if not already enabled)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if any conflict
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;

-- 3. Policy: Students can update their own notifications (e.g. set is_read = true)
CREATE POLICY "Users update own notifications" 
ON public.notifications 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Policy: Students can delete their own notifications
CREATE POLICY "Users delete own notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
