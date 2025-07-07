CREATE TABLE visitor_interactions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  lead_id UUID NOT NULL REFERENCES leads_tracking(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE visitor_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON visitor_interactions
FOR SELECT
USING (true);

CREATE POLICY "Allow insert access for service_role"
ON visitor_interactions
FOR INSERT
WITH CHECK (true); 