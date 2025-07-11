CREATE TABLE public.leads_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID UNIQUE,
  fingerprint_id TEXT,
  contact_email TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  pages_visited TEXT[],
  time_on_site INTEGER,
  session_count INTEGER DEFAULT 1,
  flat_pages_viewed TEXT[],
  chatbot_interactions JSONB,
  lead_score INTEGER DEFAULT 0,
  lead_status TEXT DEFAULT 'cold',
  lead_source TEXT,
  buyer_persona TEXT,
  qualification_answers JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_activity_at TIMESTAMP DEFAULT now(),
  gdpr_consent BOOLEAN DEFAULT false,
  gdpr_consent_date TIMESTAMP
) TABLESPACE pg_default;

-- Add indexes for performance
CREATE INDEX idx_leads_tracking_visitor_id ON public.leads_tracking(visitor_id);
CREATE INDEX idx_leads_tracking_contact_email ON public.leads_tracking(contact_email);
CREATE INDEX idx_leads_tracking_lead_status ON public.leads_tracking(lead_status);
CREATE INDEX idx_leads_tracking_lead_score ON public.leads_tracking(lead_score);
CREATE INDEX idx_leads_tracking_last_activity ON public.leads_tracking(last_activity_at);

-- Add constraints
ALTER TABLE public.leads_tracking 
ADD CONSTRAINT valid_lead_status 
CHECK (lead_status IN ('hot', 'warm', 'cold'));

ALTER TABLE public.leads_tracking 
ADD CONSTRAINT valid_email 
CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR contact_email IS NULL);