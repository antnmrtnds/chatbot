-- This file is deprecated and replaced by leads_tracking.sql
-- The leads_tracking table provides comprehensive lead management functionality
-- 
-- If you need a simple leads table for basic contact forms, use this schema:

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  flat_id TEXT,
  source TEXT DEFAULT 'contact_form',
  status TEXT DEFAULT 'new'
) TABLESPACE pg_default;

-- Add indexes for performance
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_flat_id ON public.leads(flat_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_leads_status ON public.leads(status);

-- Add constraints
ALTER TABLE public.leads 
ADD CONSTRAINT valid_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

ALTER TABLE public.leads 
ADD CONSTRAINT valid_status 
CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost'));

-- Note: Consider using leads_tracking table instead for comprehensive lead management
-- This table is kept for backward compatibility with simple contact forms