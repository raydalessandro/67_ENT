CREATE OR REPLACE FUNCTION auto_create_ai_config()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ai_agent_configs (artist_id)
  VALUES (NEW.id)
  ON CONFLICT (artist_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
