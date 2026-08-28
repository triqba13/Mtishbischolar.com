-- ============================================================================
-- Migration: 20260828000000_add_payment_type_to_payments.sql
-- Description: Adds payment_type column to public.payments table with backfill and indexes.
-- ============================================================================

-- 1. Add payment_type column with default 'file_opening_fee'
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'file_opening_fee';

-- 2. Backfill existing records
-- A: Update records that represent passport assistance (amount 300,000 or PP- reference)
UPDATE public.payments
SET payment_type = 'passport_assistance'
WHERE (payment_type IS NULL OR payment_type = 'file_opening_fee')
  AND (amount = 300000 OR transaction_ref ILIKE 'PP-%');

-- B: Set all other existing null records to 'file_opening_fee'
UPDATE public.payments
SET payment_type = 'file_opening_fee'
WHERE payment_type IS NULL;

-- 3. Set NOT NULL and DEFAULT constraints on payment_type
ALTER TABLE public.payments
ALTER COLUMN payment_type SET NOT NULL,
ALTER COLUMN payment_type SET DEFAULT 'file_opening_fee';

-- 4. Add performance index on payment_type for fast dashboard aggregation & filtering
CREATE INDEX IF NOT EXISTS idx_payments_payment_type
ON public.payments(payment_type);

-- 5. Add composite index for status and payment_type
CREATE INDEX IF NOT EXISTS idx_payments_type_status
ON public.payments(payment_type, status);

-- 6. Add composite index for student_id and payment_type
CREATE INDEX IF NOT EXISTS idx_payments_student_type
ON public.payments(student_id, payment_type);
