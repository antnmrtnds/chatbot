-- Simple RAG Visitor Tracking Tables
-- This replaces the complex visitor tracking system with a simpler one for the RAG chatbot

-- Table to store visitor information
CREATE TABLE IF NOT EXISTS rag_visitors (
    id BIGSERIAL PRIMARY KEY,
    visitor_id UUID UNIQUE NOT NULL,
    session_id TEXT NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    conversation_started BOOLEAN DEFAULT FALSE,
    messages_count INTEGER DEFAULT 0,
    lead_captured BOOLEAN DEFAULT FALSE,
    first_visit TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store chat events
CREATE TABLE IF NOT EXISTS rag_chat_events (
    id BIGSERIAL PRIMARY KEY,
    visitor_id UUID NOT NULL REFERENCES rag_visitors(visitor_id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('chat_opened', 'conversation_started', 'name_provided', 'message_sent', 'lead_captured')),
    event_data JSONB,
    page_url TEXT,
    page_context JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rag_visitors_visitor_id ON rag_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_rag_visitors_email ON rag_visitors(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rag_visitors_last_activity ON rag_visitors(last_activity);
CREATE INDEX IF NOT EXISTS idx_rag_visitors_lead_captured ON rag_visitors(lead_captured);

CREATE INDEX IF NOT EXISTS idx_rag_chat_events_visitor_id ON rag_chat_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_rag_chat_events_session_id ON rag_chat_events(session_id);
CREATE INDEX IF NOT EXISTS idx_rag_chat_events_event_type ON rag_chat_events(event_type);
CREATE INDEX IF NOT EXISTS idx_rag_chat_events_timestamp ON rag_chat_events(timestamp);

-- Enable Row Level Security
ALTER TABLE rag_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chat_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access to rag_visitors" ON rag_visitors FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to rag_visitors" ON rag_visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to rag_visitors" ON rag_visitors FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to rag_chat_events" ON rag_chat_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to rag_chat_events" ON rag_chat_events FOR INSERT WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_rag_visitors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_rag_visitors_updated_at_trigger
    BEFORE UPDATE ON rag_visitors
    FOR EACH ROW
    EXECUTE FUNCTION update_rag_visitors_updated_at();

-- View for analytics (optional)
CREATE OR REPLACE VIEW rag_visitor_analytics AS
SELECT 
    v.visitor_id,
    v.name,
    v.email,
    v.phone,
    v.conversation_started,
    v.messages_count,
    v.lead_captured,
    v.first_visit,
    v.last_activity,
    COUNT(e.id) as total_events,
    COUNT(CASE WHEN e.event_type = 'message_sent' THEN 1 END) as messages_sent,
    COUNT(CASE WHEN e.event_type = 'chat_opened' THEN 1 END) as chat_opens,
    MAX(e.timestamp) as last_event_time
FROM rag_visitors v
LEFT JOIN rag_chat_events e ON v.visitor_id = e.visitor_id
GROUP BY v.visitor_id, v.name, v.email, v.phone, v.conversation_started, 
         v.messages_count, v.lead_captured, v.first_visit, v.last_activity;

-- Grant permissions
GRANT ALL ON rag_visitors TO anon, authenticated;
GRANT ALL ON rag_chat_events TO anon, authenticated;
GRANT SELECT ON rag_visitor_analytics TO anon, authenticated;
GRANT USAGE ON SEQUENCE rag_visitors_id_seq TO anon, authenticated;
GRANT USAGE ON SEQUENCE rag_chat_events_id_seq TO anon, authenticated;