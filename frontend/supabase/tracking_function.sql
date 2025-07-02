CREATE OR REPLACE FUNCTION track_page_view(p_visitor_id UUID, p_page_url TEXT, p_flat_id TEXT)
RETURNS void AS $$
DECLARE
  v_is_new_session BOOLEAN;
  v_lead_id UUID;
BEGIN
  -- Determine if this is a new session (e.g., activity after 30 minutes of inactivity)
  SELECT (now() - last_activity_at) > interval '30 minutes'
  INTO v_is_new_session
  FROM leads_tracking
  WHERE visitor_id = p_visitor_id;

  -- If no record exists, it's a new session
  IF v_is_new_session IS NULL THEN
    v_is_new_session := true;
  END IF;

  INSERT INTO leads_tracking (visitor_id, pages_visited, flat_pages_viewed, last_activity_at, session_count)
  VALUES (
    p_visitor_id,
    ARRAY[p_page_url],
    CASE WHEN p_flat_id IS NOT NULL THEN ARRAY[p_flat_id] ELSE ARRAY[]::TEXT[] END,
    now(),
    1 -- Initial session count
  )
  ON CONFLICT (visitor_id) DO UPDATE SET
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
    END
  RETURNING id INTO v_lead_id;

  -- If the update/insert happened, v_lead_id will be populated.
  IF v_lead_id IS NOT NULL THEN
    -- Insert a record for this interaction
    INSERT INTO visitor_interactions(lead_id, interaction_type, points_awarded, details)
    VALUES (v_lead_id, 'page_view', 1, jsonb_build_object('url', p_page_url, 'flat_id', p_flat_id));

    -- Recalculate the lead score
    PERFORM calculate_lead_score(v_lead_id);
  END IF;
END;
$$ LANGUAGE plpgsql; 