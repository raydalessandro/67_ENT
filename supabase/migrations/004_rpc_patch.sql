-- ============================================================================
-- 67 Hub — RPC per increment daily usage (esegui DOPO le 3 migrazioni)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_daily_usage(
  p_artist_id UUID,
  p_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO ai_daily_usage (artist_id, usage_date, messages_used)
  VALUES (p_artist_id, p_date, 1)
  ON CONFLICT (artist_id, usage_date)
  DO UPDATE SET 
    messages_used = ai_daily_usage.messages_used + 1,
    updated_at = NOW();
END;
$$;
