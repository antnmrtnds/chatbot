CREATE OR REPLACE FUNCTION track_page_view(p_visitor_id UUID, p_page_url TEXT, p_flat_id TEXT)
RETURNS void AS $$
DECLARE
  v_is_new_session BOOLEAN;
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
    END;
END;
$$ LANGUAGE plpgsql; 