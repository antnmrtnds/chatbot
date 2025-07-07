-- Enhanced tracking function with device fingerprinting and session tracking
CREATE OR REPLACE FUNCTION track_page_view(
  p_visitor_id UUID, 
  p_page_url TEXT, 
  p_flat_id TEXT DEFAULT NULL,
  p_fingerprint_id TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_utm_params JSONB DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_is_new_session BOOLEAN;
  v_lead_id UUID;
  v_session_start_time TIMESTAMP;
BEGIN
  -- Determine if this is a new session (e.g., activity after 30 minutes of inactivity)
  SELECT 
    (now() - last_activity_at) > interval '30 minutes',
    last_activity_at
  INTO v_is_new_session, v_session_start_time
  FROM leads_tracking
  WHERE visitor_id = p_visitor_id;

  -- If no record exists, it's a new session
  IF v_is_new_session IS NULL THEN
    v_is_new_session := true;
    v_session_start_time := now();
  END IF;

  -- Insert or update visitor tracking record
  INSERT INTO leads_tracking (
    visitor_id, 
    fingerprint_id,
    pages_visited, 
    flat_pages_viewed, 
    last_activity_at, 
    session_count,
    lead_source,
    created_at
  )
  VALUES (
    p_visitor_id,
    p_fingerprint_id,
    ARRAY[p_page_url],
    CASE WHEN p_flat_id IS NOT NULL THEN ARRAY[p_flat_id] ELSE ARRAY[]::TEXT[] END,
    now(),
    1, -- Initial session count
    CASE 
      WHEN p_utm_params IS NOT NULL AND p_utm_params->>'utm_source' IS NOT NULL 
      THEN p_utm_params->>'utm_source'
      WHEN p_referrer IS NOT NULL AND p_referrer != '' 
      THEN 'referral'
      ELSE 'direct'
    END,
    now()
  )
  ON CONFLICT (visitor_id) DO UPDATE SET
    fingerprint_id = COALESCE(leads_tracking.fingerprint_id, p_fingerprint_id),
    pages_visited = array_append(leads_tracking.pages_visited, p_page_url),
    flat_pages_viewed = CASE
      WHEN p_flat_id IS NOT NULL AND NOT (leads_tracking.flat_pages_viewed @> ARRAY[p_flat_id])
      THEN array_append(leads_tracking.flat_pages_viewed, p_flat_id)
      ELSE leads_tracking.flat_pages_viewed
    END,
    last_activity_at = now(),
    session_count = CASE
      WHEN v_is_new_session THEN leads_tracking.session_count + 1
      ELSE leads_tracking.session_count
    END,
    lead_source = COALESCE(
      leads_tracking.lead_source,
      CASE 
        WHEN p_utm_params IS NOT NULL AND p_utm_params->>'utm_source' IS NOT NULL 
        THEN p_utm_params->>'utm_source'
        WHEN p_referrer IS NOT NULL AND p_referrer != '' 
        THEN 'referral'
        ELSE 'direct'
      END
    ),
    updated_at = now()
  RETURNING id INTO v_lead_id;

  -- Insert a record for this interaction
  IF v_lead_id IS NOT NULL THEN
    INSERT INTO visitor_interactions(lead_id, interaction_type, points_awarded, details)
    VALUES (v_lead_id, 'page_view', 1, jsonb_build_object(
      'url', p_page_url, 
      'flat_id', p_flat_id,
      'session_id', p_session_id,
      'referrer', p_referrer,
      'utm_params', p_utm_params,
      'is_new_session', v_is_new_session
    ));

    -- Recalculate the lead score
    PERFORM calculate_lead_score(v_lead_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- New function to track general interactions
CREATE OR REPLACE FUNCTION track_interaction(
  p_visitor_id UUID,
  p_interaction_type TEXT,
  p_details JSONB DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_lead_id UUID;
  v_points INTEGER;
BEGIN
  -- Get the lead ID for this visitor
  SELECT id INTO v_lead_id
  FROM leads_tracking
  WHERE visitor_id = p_visitor_id;

  -- If no lead exists, create one
  IF v_lead_id IS NULL THEN
    INSERT INTO leads_tracking (visitor_id, last_activity_at)
    VALUES (p_visitor_id, now())
    RETURNING id INTO v_lead_id;
  END IF;

  -- Determine points based on interaction type
  v_points := CASE p_interaction_type
    WHEN 'chat_message' THEN 5
    WHEN 'form_interaction' THEN 10
    WHEN 'download' THEN 15
    WHEN 'video_play' THEN 8
    WHEN 'phone_click' THEN 20
    WHEN 'email_click' THEN 15
    WHEN 'contact_form_view' THEN 12
    WHEN 'property_favorite' THEN 10
    WHEN 'property_share' THEN 8
    WHEN 'calculator_use' THEN 12
    ELSE 2
  END;

  -- Insert the interaction
  INSERT INTO visitor_interactions(lead_id, interaction_type, points_awarded, details)
  VALUES (v_lead_id, p_interaction_type, v_points, jsonb_build_object(
    'session_id', p_session_id,
    'timestamp', extract(epoch from now()),
    'details', p_details
  ));

  -- Update last activity
  UPDATE leads_tracking
  SET last_activity_at = now(), updated_at = now()
  WHERE id = v_lead_id;

  -- Recalculate lead score
  PERFORM calculate_lead_score(v_lead_id);
END;
$$ LANGUAGE plpgsql;

-- Function to track time spent on pages
CREATE OR REPLACE FUNCTION track_time_on_page(
  p_visitor_id UUID,
  p_page_url TEXT,
  p_time_spent INTEGER
)
RETURNS void AS $$
DECLARE
  v_lead_id UUID;
  v_points INTEGER;
BEGIN
  -- Get the lead ID for this visitor
  SELECT id INTO v_lead_id
  FROM leads_tracking
  WHERE visitor_id = p_visitor_id;

  -- Skip if no lead exists
  IF v_lead_id IS NULL THEN
    RETURN;
  END IF;

  -- Calculate points based on time spent (more time = more points)
  v_points := CASE
    WHEN p_time_spent > 300 THEN 10  -- 5+ minutes
    WHEN p_time_spent > 180 THEN 8   -- 3-5 minutes
    WHEN p_time_spent > 60 THEN 5    -- 1-3 minutes
    WHEN p_time_spent > 30 THEN 3    -- 30s-1min
    ELSE 1
  END;

  -- Insert the time tracking interaction
  INSERT INTO visitor_interactions(lead_id, interaction_type, points_awarded, details)
  VALUES (v_lead_id, 'time_on_page', v_points, jsonb_build_object(
    'url', p_page_url,
    'time_spent_seconds', p_time_spent,
    'timestamp', extract(epoch from now())
  ));

  -- Update time on site
  UPDATE leads_tracking
  SET 
    time_on_site = COALESCE(time_on_site, 0) + p_time_spent,
    last_activity_at = now(),
    updated_at = now()
  WHERE id = v_lead_id;

  -- Recalculate lead score
  PERFORM calculate_lead_score(v_lead_id);
END;
$$ LANGUAGE plpgsql; 