-- ============================================================================
-- MTISHBISCHOLARS COMPLETE SYSTEM DATABASE SCHEMA FOR SUPABASE
-- Version: 2.0 (Production Ready)
-- Execute this entire script in Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('student', 'admission_officer', 'finance_officer', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.application_status AS ENUM (
      'Profile Completed', 
      'Payment Pending', 
      'Payment Approved', 
      'Under Review', 
      'Submitted to University', 
      'University Offer Issued', 
      'Visa Approved', 
      'Rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('Pending', 'Submitted', 'Under Review', 'Approved', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('Bank Transfer', 'Mobile Money', 'Cash Office', 'Selcom Gateway');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ----------------------------------------------------------------------------
-- 2. PROFILES TABLE (Linked to auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ----------------------------------------------------------------------------
-- 3. STUDENT PROFILES TABLE (Detailed Personal & Academic Info)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT DEFAULT 'Tanzanian',
  passport_number TEXT,
  passport_expiry DATE,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Tanzania',
  highest_qualification TEXT, -- 'Form 4', 'Form 6', 'Diploma', 'Bachelor'
  high_school_name TEXT,
  graduation_year INTEGER,
  gpa_or_division TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  completion_percentage INTEGER DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ----------------------------------------------------------------------------
-- 4. UNIVERSITIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  location TEXT NOT NULL,
  accreditation TEXT,
  description TEXT,
  logo_url TEXT,
  image_url TEXT,
  scholarship_tag TEXT DEFAULT 'Up to 50% Scholarship',
  is_featured BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ----------------------------------------------------------------------------
-- 5. COURSES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  level TEXT NOT NULL, -- 'Bachelor', 'Master', 'PhD', 'Diploma'
  duration TEXT NOT NULL, -- '3 Years', '4 Years', etc.
  tuition_fee NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  scholarship_percentage NUMERIC(5,2) DEFAULT 50.00,
  intake_months TEXT DEFAULT 'September / January',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ----------------------------------------------------------------------------
-- 6. APPLICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  target_country TEXT NOT NULL,
  admission_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.application_status DEFAULT 'Profile Completed'::public.application_status NOT NULL,
  offer_letter_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ----------------------------------------------------------------------------
-- 7. DOCUMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'Passport', 'Form4_Cert', 'Form6_Cert', 'Transcript', 'SOP', 'CV'
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ----------------------------------------------------------------------------
-- 8. PAYMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  payment_type TEXT DEFAULT 'file_opening_fee' NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  payment_method public.payment_method DEFAULT 'Bank Transfer'::public.payment_method NOT NULL,
  transaction_ref TEXT UNIQUE NOT NULL,
  payment_proof_url TEXT,
  status public.payment_status DEFAULT 'Pending'::public.payment_status NOT NULL,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ----------------------------------------------------------------------------
-- 9. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system', -- 'payment', 'application', 'document', 'system'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ----------------------------------------------------------------------------
-- 10. AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public Read for Universities & Courses
CREATE POLICY "Public can view universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Public can view courses" ON public.courses FOR SELECT USING (true);

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Student Profiles RLS
CREATE POLICY "Students can view own student profile" ON public.student_profiles FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can update own student profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own student profile" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Applications RLS
CREATE POLICY "Students view own applications" ON public.applications FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students insert own applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own applications" ON public.applications FOR UPDATE USING (auth.uid() = student_id);

-- Documents RLS
CREATE POLICY "Students view own documents" ON public.documents FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students upload own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Payments RLS
CREATE POLICY "Students view own payments" ON public.payments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students submit own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Notifications RLS
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 12. AUTOMATIC USER CREATION TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  v_first_name := COALESCE(new.raw_user_meta_data->>'first_name', 'Student');
  v_last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');

  -- Insert profile
  INSERT INTO public.profiles (id, first_name, last_name, email, role)
  VALUES (new.id, v_first_name, v_last_name, new.email, 'student')
  ON CONFLICT (id) DO NOTHING;

  -- Insert blank student profile
  INSERT INTO public.student_profiles (student_id)
  VALUES (new.id)
  ON CONFLICT (student_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ----------------------------------------------------------------------------
-- 13. SEED INITIAL UNIVERSITIES & COURSES
-- ----------------------------------------------------------------------------
INSERT INTO public.universities (id, name, country, location, accreditation, scholarship_tag, image_url)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Parul University', 'India', 'Vadodara, Gujarat', 'NAAC A++ Grade', 'Flat 50% Scholarship', '/videos/images/india.jpg'),
  ('22222222-2222-2222-2222-222222222222', 'Vistula University', 'Poland', 'Warsaw, Poland', 'CEEMAN IQA Accredited', 'Schengen EU Subsidy', '/videos/images/poland.jpg'),
  ('33333333-3333-3333-3333-333333333333', 'European University of Lefke', 'Cyprus', 'Lefke, Northern Cyprus', 'YOK & FIBAA Approved', '50% Guaranteed Waiver', '/videos/images/cyprus.jpg'),
  ('44444444-4444-4444-4444-444444444444', 'Asia Pacific University (APU)', 'Malaysia', 'Kuala Lumpur, Malaysia', 'SETARA 5-Star University', 'Dual UK Degree Option', '/videos/images/malaysia.jpg')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.courses (university_id, title, level, duration, tuition_fee, scholarship_percentage)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'B.Tech Computer Science & AI', 'Bachelor', '4 Years', 2200.00, 50.00),
  ('11111111-1111-1111-1111-111111111111', 'Bachelor of Business Administration (BBA)', 'Bachelor', '3 Years', 1800.00, 50.00),
  ('22222222-2222-2222-2222-222222222222', 'BA Architecture', 'Bachelor', '4 Years', 4100.00, 20.00),
  ('22222222-2222-2222-2222-222222222222', 'BA International Relations', 'Bachelor', '3 Years', 4100.00, 20.00),
  ('33333333-3333-3333-3333-333333333333', 'B.Sc Nursing', 'Bachelor', '4 Years', 3100.00, 50.00),
  ('44444444-4444-4444-4444-444444444444', 'BSc Cybersecurity', 'Bachelor', '3 Years', 4200.00, 30.00)
ON CONFLICT DO NOTHING;
