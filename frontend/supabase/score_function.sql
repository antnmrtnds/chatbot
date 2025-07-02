CREATE OR REPLACE FUNCTION calculate_lead_score(lead_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_score INTEGER := 0;
  interaction_score INTEGER;
  behavioral_score INTEGER;
  contact_score INTEGER;
BEGIN
  -- Calculate interaction-based score
  SELECT COALESCE(SUM(points_awarded), 0) INTO interaction_score
  FROM visitor_interactions 
  WHERE lead_id = lead_uuid;
  
  -- Update lead with new score and status
  UPDATE leads_tracking
  SET 
    lead_score = total_score,
    lead_status = CASE 
      WHEN total_score >= 80 THEN 'hot'
      WHEN total_score >= 40 THEN 'warm'
      ELSE 'cold'
    END,
    updated_at = now()
  WHERE id = lead_uuid;
  
  -- Trigger notification for hot leads
  IF total_score >= 80 THEN
    PERFORM pg_notify('hot_lead_alert', json_build_object(
      'lead_id', lead_uuid,
      'score', total_score,
      'timestamp', extract(epoch from now())
    )::text);
  END IF;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql;
