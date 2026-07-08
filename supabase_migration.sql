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

-- 5. Create user_plans table for paid tiers
CREATE TABLE IF NOT EXISTS user_plans (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'team')),
  daily_limit INT NOT NULL DEFAULT 3,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own plans"
ON user_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage plans"
ON user_plans FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Create function to get user's daily limit from user_plans
CREATE OR REPLACE FUNCTION get_user_daily_limit(user_id_input UUID)
RETURNS INT AS $$
DECLARE
  user_limit INT;
BEGIN
  SELECT COALESCE(p.daily_limit, 3) INTO user_limit
  FROM user_plans p WHERE p.user_id = user_id_input;
  
  IF user_limit IS NULL THEN
    user_limit := 3;
  END IF;
  
  RETURN user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to get today's remaining quota (reads user_plans for dynamic limit)
CREATE OR REPLACE FUNCTION get_daily_quota(user_id_input UUID)
RETURNS TABLE(used INT, remaining INT, max_per_day INT) AS $$
DECLARE
  user_limit INT;
  user_count INT;
BEGIN
  user_limit := get_user_daily_limit(user_id_input);
  
  SELECT COALESCE(
    (SELECT uq.count FROM user_quotas uq WHERE uq.user_id = user_id_input AND uq.date = CURRENT_DATE),
    0
  ) INTO user_count;

  used := user_count;
  remaining := GREATEST(user_limit - user_count, 0);
  max_per_day := user_limit;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to increment quota (uses dynamic limit from user_plans)
CREATE OR REPLACE FUNCTION increment_daily_quota(user_id_input UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_limit INT;
  current_count INT;
BEGIN
  user_limit := get_user_daily_limit(user_id_input);
  
  INSERT INTO user_quotas (user_id, date, count)
  VALUES (user_id_input, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET count = user_quotas.count + 1
  RETURNING count INTO current_count;
  
  RETURN current_count <= user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
