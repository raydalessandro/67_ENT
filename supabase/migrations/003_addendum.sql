-- ============================================================================
-- 67 Hub - Addendum: Staff Chat View + Video Thumbnails
-- ============================================================================
-- Eseguire DOPO la migration ai-chat e la migration iniziale.
-- ============================================================================

-- ============================================================================
-- 1. VIDEO THUMBNAILS — Colonne aggiuntive su post_media
-- ============================================================================

ALTER TABLE post_media
  ADD COLUMN IF NOT EXISTS thumbnail_path TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (thumbnail_status IN ('pending', 'processing', 'ready', 'failed'));

-- Imposta 'ready' per le immagini (non servono thumbnail)
UPDATE post_media
SET thumbnail_status = 'ready'
WHERE mime_type NOT LIKE 'video/%';

-- Index per trovare video senza thumbnail (per job di retry)
CREATE INDEX IF NOT EXISTS idx_post_media_thumb_pending
  ON post_media(thumbnail_status)
  WHERE mime_type LIKE 'video/%' AND thumbnail_status IN ('pending', 'failed');

-- ============================================================================
-- 2. AI CHAT — View admin per sessioni con statistiche
-- ============================================================================

CREATE OR REPLACE VIEW ai_chat_sessions_admin AS
SELECT
  s.id,
  s.artist_id,
  s.user_id,
  s.title,
  s.is_active,
  s.created_at,
  s.updated_at,
  a.name AS artist_name,
  a.color AS artist_color,
  u.display_name AS user_name,
  (
    SELECT COUNT(*)
    FROM ai_chat_messages m
    WHERE m.session_id = s.id
  )::INTEGER AS message_count,
  (
    SELECT MAX(m.created_at)
    FROM ai_chat_messages m
    WHERE m.session_id = s.id
  ) AS last_message_at,
  (
    SELECT COALESCE(SUM(m.tokens_used), 0)
    FROM ai_chat_messages m
    WHERE m.session_id = s.id
  )::INTEGER AS total_tokens
FROM ai_chat_sessions s
JOIN artists a ON s.artist_id = a.id
JOIN users u ON s.user_id = u.id
ORDER BY s.updated_at DESC;

-- ============================================================================
-- 3. AI USAGE — View stats aggregate per artista
-- ============================================================================

CREATE OR REPLACE VIEW ai_usage_stats AS
SELECT
  a.id AS artist_id,
  a.name AS artist_name,
  a.color AS artist_color,
  cfg.is_enabled,
  cfg.daily_message_limit,
  -- Oggi
  COALESCE(
    (SELECT message_count FROM ai_daily_usage
     WHERE user_id = a.user_id AND usage_date = CURRENT_DATE),
    0
  )::INTEGER AS used_today,
  -- Questa settimana (da lunedì)
  COALESCE(
    (SELECT SUM(message_count) FROM ai_daily_usage
     WHERE user_id = a.user_id
     AND usage_date >= date_trunc('week', CURRENT_DATE)),
    0
  )::INTEGER AS used_this_week,
  -- Questo mese
  COALESCE(
    (SELECT SUM(message_count) FROM ai_daily_usage
     WHERE user_id = a.user_id
     AND usage_date >= date_trunc('month', CURRENT_DATE)),
    0
  )::INTEGER AS used_this_month,
  -- Token totali mese
  COALESCE(
    (SELECT SUM(m.tokens_used)
     FROM ai_chat_messages m
     JOIN ai_chat_sessions s ON m.session_id = s.id
     WHERE s.artist_id = a.id
     AND m.created_at >= date_trunc('month', CURRENT_DATE)),
    0
  )::INTEGER AS tokens_this_month,
  -- Totale sessioni
  (SELECT COUNT(*) FROM ai_chat_sessions s WHERE s.artist_id = a.id)::INTEGER AS total_sessions
FROM artists a
LEFT JOIN ai_agent_configs cfg ON cfg.artist_id = a.id
WHERE a.is_label = FALSE
  AND a.user_id IS NOT NULL;
