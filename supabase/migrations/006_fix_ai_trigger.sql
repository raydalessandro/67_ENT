-- ============================================================================
-- Fix AI auto-create trigger to use is_active instead of is_label
-- ============================================================================

-- Drop old function and trigger
DROP TRIGGER IF EXISTS trigger_auto_create_ai_config ON artists;
DROP FUNCTION IF EXISTS auto_create_ai_config();

-- Recreate with correct column name
CREATE OR REPLACE FUNCTION auto_create_ai_config()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.is_active = TRUE THEN
    INSERT INTO ai_agent_configs (artist_id)
    VALUES (NEW.id)
    ON CONFLICT (artist_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_create_ai_config
  AFTER INSERT ON artists
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_ai_config();

-- Backfill: create configs for existing artists that don't have one
INSERT INTO ai_agent_configs (artist_id)
SELECT id FROM artists
WHERE is_active = TRUE
AND user_id IS NOT NULL
AND id NOT IN (SELECT artist_id FROM ai_agent_configs)
ON CONFLICT (artist_id) DO NOTHING;
