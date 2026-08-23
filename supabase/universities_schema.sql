-- ==============================================================================
-- MTISHBISCHOLAR SYSTEM ARCHITECTURE - UNIVERSITIES TABLE & SEED DATA
-- Run this SQL query directly in your Supabase SQL Editor to create the table
-- ==============================================================================

-- Drop existing table if it was created previously with an old schema
DROP TABLE IF EXISTS public.universities CASCADE;

-- Create fresh universities table
CREATE TABLE public.universities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  flag TEXT NOT NULL,
  scholarship TEXT NOT NULL,
  courses TEXT[] NOT NULL DEFAULT '{}',
  intakes TEXT[] NOT NULL DEFAULT '{}',
  tuition_fee_usd NUMERIC NOT NULL DEFAULT 0,
  featured BOOLEAN DEFAULT true,
  image TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Allow public read access to universities
CREATE POLICY "Allow public read access to universities" 
  ON public.universities 
  FOR SELECT 
  USING (true);

-- Insert Seed Partner Universities into Supabase Database
INSERT INTO public.universities (id, name, country, city, flag, scholarship, courses, intakes, tuition_fee_usd, featured, image, description)
VALUES 
  (
    'parul-india',
    'Parul University',
    'India',
    'Vadodara, Gujarat',
    '🇮🇳',
    '50% Guaranteed Scholarship',
    ARRAY['B.Tech Computer Science & AI', 'B.Tech Information Technology', 'Bachelor of Business Administration (BBA)', 'Bachelor of Pharmacy (B.Pharm)', 'B.Sc Nursing', 'MBA Global Business'],
    ARRAY['September 2026', 'January 2027'],
    2500,
    true,
    '/videos/images/india.jpg',
    'NAAC A++ Accredited University in India providing world-class tech and engineering degrees with guaranteed 50% tuition waiver for African students.'
  ),
  (
    'srm-india',
    'SRM University AP',
    'India',
    'Andhra Pradesh',
    '🇮🇳',
    '50% Merit Scholarship',
    ARRAY['B.Tech Computer Science Engineering', 'B.Tech Mechanical Engineering', 'BBA International Finance', 'M.Tech Artificial Intelligence'],
    ARRAY['September 2026'],
    3000,
    true,
    '/videos/images/india.jpg',
    'Top-ranked private research university with state-of-the-art innovation labs and international exchange opportunities.'
  ),
  (
    'vistula-poland',
    'Vistula University',
    'Poland',
    'Warsaw',
    '🇵🇱',
    'Schengen EU Subsidized Tuition',
    ARRAY['BA Architecture & Design', 'BA International Relations', 'B.Sc Computer Engineering', 'MA Global Management'],
    ARRAY['October 2026', 'February 2027'],
    3200,
    true,
    '/videos/images/poland.jpg',
    'Located in Warsaw, Poland. Offers full Schengen Visa access across 27 European nations with English-taught degree programs.'
  ),
  (
    'eul-cyprus',
    'European University of Lefke (EUL)',
    'Cyprus',
    'Lefke',
    '🇨🇾',
    '50% Guaranteed Waiver',
    ARRAY['B.Sc Software Engineering', 'B.Sc Civil Engineering', 'BA Tourism & Hospitality Management', 'MBA Logistics & Supply Chain'],
    ARRAY['September 2026', 'February 2027'],
    2800,
    true,
    '/videos/images/cyprus.jpg',
    'Beautiful Mediterranean island campus offering affordable British-standard degrees with high visa success rates for Tanzanian students.'
  ),
  (
    'apu-malaysia',
    'Asia Pacific University (APU)',
    'Malaysia',
    'Kuala Lumpur',
    '🇲🇾',
    'Dual UK Degree Option',
    ARRAY['B.Sc (Hons) Cybersecurity', 'B.Sc (Hons) Data Analytics', 'BBA Digital Transformation', 'M.Sc Artificial Intelligence'],
    ARRAY['September 2026', 'November 2026'],
    4500,
    true,
    '/videos/images/malaysia.jpg',
    'Premier technology university in Kuala Lumpur offering dual degree awards with De Montfort University (UK).'
  ),
  (
    'abertay-uk',
    'Abertay University',
    'UK',
    'Dundee, Scotland',
    '🇬🇧',
    '£3,000 International Bursary',
    ARRAY['B.Sc (Hons) Computer Games Technology', 'BA (Hons) Business Management', 'M.Sc Ethical Hacking & Cybersecurity'],
    ARRAY['September 2026', 'January 2027'],
    14000,
    true,
    '/videos/images/UK.jpg',
    'Renowned UK University in Dundee, Scotland, famous for world-leading technology, business, and cybersecurity programs.'
  ),
  (
    'zhejiang-china',
    'Zhejiang University',
    'China',
    'Hangzhou',
    '🇨🇳',
    'Chinese Government Scholarship (CSC)',
    ARRAY['MBBS Clinical Medicine (English Medium)', 'B.Eng Mechanical Engineering', 'M.Sc Environmental Science'],
    ARRAY['September 2026'],
    3500,
    true,
    '/videos/images/china.jpg',
    'Top 3 university in China providing world-class English-taught MBBS medicine and engineering programs with generous CSC scholarships.'
  ),
  (
    'eserp-spain',
    'ESERP Business School',
    'Spain',
    'Barcelona & Madrid',
    '🇪🇸',
    '30% Merit Subsidized Fee',
    ARRAY['Bachelor in Business Management & Law', 'Bachelor in International Trade', 'Master in Digital Marketing & FinTech'],
    ARRAY['October 2026'],
    6000,
    true,
    '/videos/images/spain.jpg',
    'Leading Spanish business academy offering top-ranking European business degrees in vibrant Barcelona & Madrid.'
  );
