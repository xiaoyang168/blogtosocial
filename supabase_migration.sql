-- BlogToSocial Quota System
-- Run this in Supabase SQL Editor: https://app.supabase.com → your project → SQL Editor

-- 1. Create user_quotas table
CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 2. Enable Row Level Security
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- 3. Allow users to read their own quotas
CREATE POLICY "Users can read own quotas"
ON user_quotas FOR SELECT
USING (auth.uid() = user_id);

-- 4. Allow the server (service_role) to insert/update
CREATE POLICY "Service can manage quotas"
ON user_quotas FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Create function to get today's remaining quota for a user
CREATE OR REPLACE FUNCTION get_daily_quota(user_id_input UUID)
RETURNS TABLE(used INT, remaining INT, max_per_day INT) AS $$
DECLARE
  daily_limit INT := 3; -- Free tier: 3 generations per day
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

-- 6. Create function to increment quota (returns true if within limit)
CREATE OR REPLACE FUNCTION increment_daily_quota(user_id_input UUID)
RETURNS BOOLEAN AS $$
DECLARE
  daily_limit INT := 3;
  current_count INT;
BEGIN
  -- Upsert: insert if not exists, update if exists
  INSERT INTO user_quotas (user_id, date, count)
  VALUES (user_id_input, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET count = user_quotas.count + 1
  RETURNING count INTO current_count;
  
  RETURN current_count <= daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
