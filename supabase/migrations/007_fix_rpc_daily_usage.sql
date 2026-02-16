-- ============================================================================
-- Fix RPC increment_daily_usage to use correct column names
-- ============================================================================

-- Drop old function
DROP FUNCTION IF EXISTS increment_daily_usage(UUID, DATE);

-- Recreate with correct signature and column names
CREATE OR REPLACE FUNCTION increment_daily_usage(
  p_user_id UUID,
  p_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO ai_daily_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    message_count = ai_daily_usage.message_count + 1;
END;
$$;
