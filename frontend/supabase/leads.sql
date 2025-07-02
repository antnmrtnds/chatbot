CREATE TABLE leads_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID UNIQUE, -- ID anónimo do visitante
  fingerprint_id TEXT, -- Impressão digital do dispositivo
  contact_email TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  -- Dados Comportamentais
  pages_visited TEXT[], -- URLs visitadas
  time_on_site INTEGER, -- Tempo total em segundos
  session_count INTEGER DEFAULT 1,
  flat_pages_viewed TEXT[], -- Frações específicas visualizadas
  chatbot_interactions JSONB, -- Histórico completo de chat
  -- Campos de Pontuação
  lead_score INTEGER DEFAULT 0,
  lead_status TEXT DEFAULT 'cold', -- hot, warm, cold
  lead_source TEXT, -- organic, paid, referral, etc.
  -- Dados de Classificação
  buyer_persona TEXT, -- tech_professional, medical_professional, family, investor
  qualification_answers JSONB, -- Respostas BANT/CHAMP
  -- Metadados
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_activity_at TIMESTAMP DEFAULT now(),
  gdpr_consent BOOLEAN DEFAULT false,
  gdpr_consent_date TIMESTAMP
);
