CREATE OR REPLACE FUNCTION increment_daily_usage(p_user_id UUID, p_usage_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO public.ai_daily_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, p_usage_date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET message_count = ai_daily_usage.message_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
