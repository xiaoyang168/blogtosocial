-- Fix get_daily_quota function: handle null when no quota record exists
CREATE OR REPLACE FUNCTION get_daily_quota(user_id_input UUID)
RETURNS TABLE(used INT, remaining INT, max_per_day INT) AS $$
DECLARE
  daily_limit INT := 3;
  user_count INT;
BEGIN
  -- Subquery ensures we always get a row (COALESCE to 0 if null)
  SELECT COALESCE(
    (SELECT uq.count FROM user_quotas uq WHERE uq.user_id = user_id_input AND uq.date = CURRENT_DATE),
    0
  ) INTO user_count;

  used := user_count;
  remaining := GREATEST(daily_limit - user_count, 0);
  max_per_day := daily_limit;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify: this should return 0, 3, 3 for any user without a quota record today
-- SELECT * FROM get_daily_quota('your-user-id-uuid');
