CREATE TABLE public.visitor_interactions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  lead_id UUID NOT NULL REFERENCES leads_tracking(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
) TABLESPACE pg_default;

-- Add indexes for performance
CREATE INDEX idx_visitor_interactions_lead_id ON public.visitor_interactions(lead_id);
CREATE INDEX idx_visitor_interactions_type ON public.visitor_interactions(interaction_type);
CREATE INDEX idx_visitor_interactions_created_at ON public.visitor_interactions(created_at);

-- Add constraints
ALTER TABLE public.visitor_interactions
ADD CONSTRAINT valid_interaction_type
CHECK (interaction_type IN (
  'page_view',
  'page_type_view',
  'property_view',
  'contact_form',
  'chat_interaction',
  'download',
  'email_open',
  'link_click',
  'button_click',
  'form_interaction',
  'scroll_depth_25',
  'scroll_depth_50',
  'scroll_depth_75',
  'scroll_depth_100',
  'time_on_page',
  'chat_message',
  'video_play',
  'phone_click',
  'email_click',
  'contact_form_view',
  'property_favorite',
  'property_share',
  'calculator_use'
));

-- Enable Row Level Security
ALTER TABLE public.visitor_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to all users"
ON public.visitor_interactions
FOR SELECT
USING (true);

CREATE POLICY "Allow insert access for service_role"
ON public.visitor_interactions
FOR INSERT
WITH CHECK (true);