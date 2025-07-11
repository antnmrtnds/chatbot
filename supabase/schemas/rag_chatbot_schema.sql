-- RAG Chatbot Enhanced Database Schema
-- This extends the existing schema with new tables for RAG functionality

-- =====================================================
-- VISITOR PROFILES (Enhanced visitor tracking)
-- =====================================================
CREATE TABLE public.visitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID UNIQUE NOT NULL,
  
  -- Basic Information
  fingerprint_hash TEXT,
  device_info JSONB,
  first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Session Management
  current_session_id TEXT,
  session_count INTEGER DEFAULT 1,
  total_time_on_site INTEGER DEFAULT 0, -- seconds
  
  -- Behavioral Data
  pages_visited TEXT[],
  interaction_patterns JSONB,
  engagement_score INTEGER DEFAULT 0,
  
  -- Preferences & Context
  preferences JSONB DEFAULT '{}',
  conversation_context JSONB DEFAULT '{}',
  
  -- Lead Information
  lead_status TEXT DEFAULT 'anonymous' CHECK (lead_status IN ('anonymous', 'visitor', 'lead', 'qualified', 'customer')),
  lead_score INTEGER DEFAULT 0,
  qualification_data JSONB DEFAULT '{}',
  
  -- Contact Information
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_preferences JSONB DEFAULT '{}',
  
  -- Compliance
  gdpr_consent BOOLEAN DEFAULT FALSE,
  gdpr_consent_date TIMESTAMP WITH TIME ZONE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for visitor_profiles
CREATE INDEX idx_visitor_profiles_visitor_id ON public.visitor_profiles(visitor_id);
CREATE INDEX idx_visitor_profiles_fingerprint ON public.visitor_profiles(fingerprint_hash);
CREATE INDEX idx_visitor_profiles_lead_status ON public.visitor_profiles(lead_status);
CREATE INDEX idx_visitor_profiles_lead_score ON public.visitor_profiles(lead_score);
CREATE INDEX idx_visitor_profiles_last_visit ON public.visitor_profiles(last_visit_at);

-- =====================================================
-- PAGE CONTEXT REGISTRY
-- =====================================================
CREATE TABLE public.page_context_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Page Identification
  url_pattern TEXT NOT NULL,
  semantic_id TEXT UNIQUE NOT NULL,
  page_type TEXT NOT NULL CHECK (page_type IN ('home', 'property', 'listing', 'about', 'contact', 'blog', 'other')),
  
  -- Page Metadata
  title TEXT,
  description TEXT,
  keywords TEXT[],
  
  -- Context Data for RAG
  context_data JSONB DEFAULT '{}',
  property_metadata JSONB DEFAULT '{}',
  
  -- RAG Configuration
  rag_enabled BOOLEAN DEFAULT TRUE,
  context_priority INTEGER DEFAULT 1, -- 1=highest, 5=lowest
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for page_context_registry
CREATE INDEX idx_page_context_url_pattern ON public.page_context_registry(url_pattern);
CREATE INDEX idx_page_context_semantic_id ON public.page_context_registry(semantic_id);
CREATE INDEX idx_page_context_type ON public.page_context_registry(page_type);

-- =====================================================
-- CONVERSATION SESSIONS
-- =====================================================
CREATE TABLE public.conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session Identification
  session_id TEXT UNIQUE NOT NULL,
  visitor_id UUID NOT NULL REFERENCES public.visitor_profiles(visitor_id) ON DELETE CASCADE,
  
  -- Session Context
  page_context_id UUID REFERENCES public.page_context_registry(id),
  initial_page_url TEXT,
  current_page_url TEXT,
  
  -- Conversation Data
  message_count INTEGER DEFAULT 0,
  conversation_history JSONB DEFAULT '[]',
  context_memory JSONB DEFAULT '{}',
  
  -- Flow Management
  active_flow TEXT,
  flow_state JSONB DEFAULT '{}',
  flow_progress JSONB DEFAULT '{}',
  
  -- Lead Capture
  lead_capture_triggered BOOLEAN DEFAULT FALSE,
  lead_capture_completed BOOLEAN DEFAULT FALSE,
  lead_capture_attempts INTEGER DEFAULT 0,
  
  -- Session Metrics
  duration_seconds INTEGER DEFAULT 0,
  user_satisfaction_score INTEGER, -- 1-5 rating
  conversion_event TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for conversation_sessions
CREATE INDEX idx_conversation_sessions_session_id ON public.conversation_sessions(session_id);
CREATE INDEX idx_conversation_sessions_visitor_id ON public.conversation_sessions(visitor_id);
CREATE INDEX idx_conversation_sessions_status ON public.conversation_sessions(status);
CREATE INDEX idx_conversation_sessions_last_activity ON public.conversation_sessions(last_activity_at);

-- =====================================================
-- DOCUMENT EMBEDDINGS (RAG Vector Store Metadata)
-- =====================================================
CREATE TABLE public.document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document Identification
  document_id TEXT UNIQUE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('brochure', 'floor_plan', 'listing', 'faq', 'policy', 'other')),
  document_name TEXT NOT NULL,
  document_url TEXT,
  
  -- Content Information
  content_hash TEXT NOT NULL,
  content_preview TEXT,
  chunk_count INTEGER DEFAULT 0,
  
  -- Metadata for RAG
  metadata JSONB DEFAULT '{}',
  property_ids TEXT[], -- Associated property IDs
  keywords TEXT[],
  
  -- Vector Store Information
  vector_store_id TEXT, -- External vector store reference
  embedding_model TEXT DEFAULT 'text-embedding-ada-002',
  
  -- Processing Status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  
  -- Usage Statistics
  retrieval_count INTEGER DEFAULT 0,
  last_retrieved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for document_embeddings
CREATE INDEX idx_document_embeddings_document_id ON public.document_embeddings(document_id);
CREATE INDEX idx_document_embeddings_type ON public.document_embeddings(document_type);
CREATE INDEX idx_document_embeddings_status ON public.document_embeddings(processing_status);
CREATE INDEX idx_document_embeddings_property_ids ON public.document_embeddings USING GIN(property_ids);

-- =====================================================
-- LEAD CAPTURE EVENTS (Progressive Lead Tracking)
-- =====================================================
CREATE TABLE public.lead_capture_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Identification
  visitor_id UUID NOT NULL REFERENCES public.visitor_profiles(visitor_id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN ('trigger', 'attempt', 'partial', 'complete', 'abandon')),
  trigger_reason TEXT, -- 'message_count', 'high_intent', 'explicit_request', etc.
  
  -- Capture Data
  captured_fields JSONB DEFAULT '{}',
  missing_fields TEXT[],
  
  -- Context
  page_context TEXT,
  conversation_context JSONB DEFAULT '{}',
  
  -- Results
  success BOOLEAN DEFAULT FALSE,
  completion_rate DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lead_capture_events
CREATE INDEX idx_lead_capture_events_visitor_id ON public.lead_capture_events(visitor_id);
CREATE INDEX idx_lead_capture_events_session_id ON public.lead_capture_events(session_id);
CREATE INDEX idx_lead_capture_events_type ON public.lead_capture_events(event_type);
CREATE INDEX idx_lead_capture_events_created_at ON public.lead_capture_events(created_at);

-- =====================================================
-- ANALYTICS EVENTS (Enhanced Event Tracking)
-- =====================================================
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Identification
  visitor_id UUID REFERENCES public.visitor_profiles(visitor_id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  
  -- Event Details
  event_category TEXT NOT NULL, -- 'chatbot', 'navigation', 'engagement', etc.
  event_action TEXT NOT NULL,
  event_label TEXT,
  event_value INTEGER,
  
  -- Context
  page_url TEXT,
  page_context_id UUID REFERENCES public.page_context_registry(id),
  user_agent TEXT,
  
  -- Custom Properties
  properties JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics_events
CREATE INDEX idx_analytics_events_visitor_id ON public.analytics_events(visitor_id);
CREATE INDEX idx_analytics_events_category ON public.analytics_events(event_category);
CREATE INDEX idx_analytics_events_action ON public.analytics_events(event_action);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.visitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_context_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_capture_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Visitor Profiles Policies
CREATE POLICY "Allow read access to own visitor profile"
ON public.visitor_profiles
FOR SELECT
USING (auth.uid() IS NOT NULL OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Allow insert/update for service role"
ON public.visitor_profiles
FOR ALL
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Page Context Registry Policies (Public read access)
CREATE POLICY "Allow read access to page context"
ON public.page_context_registry
FOR SELECT
USING (true);

CREATE POLICY "Allow admin access to page context"
ON public.page_context_registry
FOR ALL
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Conversation Sessions Policies
CREATE POLICY "Allow access to own conversation sessions"
ON public.conversation_sessions
FOR ALL
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Document Embeddings Policies (Public read for processed documents)
CREATE POLICY "Allow read access to processed documents"
ON public.document_embeddings
FOR SELECT
USING (processing_status = 'completed');

CREATE POLICY "Allow admin access to document embeddings"
ON public.document_embeddings
FOR ALL
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Lead Capture Events Policies
CREATE POLICY "Allow service role access to lead capture events"
ON public.lead_capture_events
FOR ALL
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Analytics Events Policies
CREATE POLICY "Allow service role access to analytics events"
ON public.analytics_events
FOR ALL
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_visitor_profiles_updated_at 
    BEFORE UPDATE ON public.visitor_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_context_registry_updated_at 
    BEFORE UPDATE ON public.page_context_registry 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_embeddings_updated_at 
    BEFORE UPDATE ON public.document_embeddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate lead score based on visitor behavior
CREATE OR REPLACE FUNCTION calculate_visitor_lead_score(visitor_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    visitor_data RECORD;
    session_count INTEGER;
    avg_session_duration DECIMAL;
    recent_activity_days INTEGER;
BEGIN
    -- Get visitor data
    SELECT * INTO visitor_data FROM public.visitor_profiles WHERE visitor_id = visitor_uuid;
    
    IF visitor_data IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Base score from engagement
    score := visitor_data.engagement_score;
    
    -- Session frequency bonus
    IF visitor_data.session_count > 1 THEN
        score := score + (visitor_data.session_count * 5);
    END IF;
    
    -- Time on site bonus
    IF visitor_data.total_time_on_site > 300 THEN -- 5 minutes
        score := score + 10;
    END IF;
    
    IF visitor_data.total_time_on_site > 900 THEN -- 15 minutes
        score := score + 20;
    END IF;
    
    -- Contact information bonus
    IF visitor_data.contact_email IS NOT NULL THEN
        score := score + 25;
    END IF;
    
    IF visitor_data.contact_phone IS NOT NULL THEN
        score := score + 15;
    END IF;
    
    IF visitor_data.contact_name IS NOT NULL THEN
        score := score + 10;
    END IF;
    
    -- Recent activity bonus
    recent_activity_days := EXTRACT(DAY FROM NOW() - visitor_data.last_visit_at);
    IF recent_activity_days <= 1 THEN
        score := score + 15;
    ELSIF recent_activity_days <= 7 THEN
        score := score + 10;
    END IF;
    
    -- GDPR consent bonus (shows engagement)
    IF visitor_data.gdpr_consent THEN
        score := score + 5;
    END IF;
    
    -- Cap the score at 100
    IF score > 100 THEN
        score := 100;
    END IF;
    
    -- Update the visitor profile with new score
    UPDATE public.visitor_profiles 
    SET lead_score = score, updated_at = NOW()
    WHERE visitor_id = visitor_uuid;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default page contexts
INSERT INTO public.page_context_registry (url_pattern, semantic_id, page_type, title, description, context_data) VALUES
('/', 'home', 'home', 'Viriato - Home', 'Main landing page', '{"priority": 1, "features": ["hero", "properties", "contact"]}'),
('/imoveis/evergreen-pure', 'evergreen-pure-listing', 'listing', 'Evergreen Pure - Apartamentos', 'Property listing page', '{"project": "evergreen-pure", "type": "listing"}'),
('/imoveis/evergreen-pure/[flatId]', 'evergreen-pure-property', 'property', 'Evergreen Pure - Apartamento', 'Individual property page', '{"project": "evergreen-pure", "type": "property"}'),
('/sobre', 'about', 'about', 'Sobre Nós', 'About page', '{"priority": 3}'),
('/contacto', 'contact', 'contact', 'Contacto', 'Contact page', '{"priority": 2}');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitor_profiles_composite 
ON public.visitor_profiles(lead_status, lead_score DESC, last_visit_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_composite 
ON public.conversation_sessions(visitor_id, status, last_activity_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.visitor_profiles IS 'Enhanced visitor tracking with behavioral data and lead scoring';
COMMENT ON TABLE public.page_context_registry IS 'Registry of site pages with metadata for RAG context';
COMMENT ON TABLE public.conversation_sessions IS 'Chat session management with flow state tracking';
COMMENT ON TABLE public.document_embeddings IS 'Metadata for RAG document embeddings and vector store';
COMMENT ON TABLE public.lead_capture_events IS 'Progressive lead capture event tracking';
COMMENT ON TABLE public.analytics_events IS 'Enhanced analytics event tracking';