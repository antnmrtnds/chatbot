-- supabase/schemas/visitors.sql

CREATE TABLE public.visitors (
  id SERIAL PRIMARY KEY,
  visitor_id UUID NOT NULL UNIQUE,
  onboarding_answers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON public.visitors
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON public.visitors
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on visitor_id"
ON public.visitors
FOR UPDATE
USING (auth.uid() = visitor_id)
WITH CHECK (auth.uid() = visitor_id); 