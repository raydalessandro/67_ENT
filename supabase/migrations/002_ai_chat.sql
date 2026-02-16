-- ============================================================================
-- 67 Hub - AI Chat Module (Migration ISOLATA)
-- ============================================================================
-- Può essere eseguita/rollbackata indipendentemente dal resto.
-- Per disattivare: basta nascondere la route nel frontend.
-- Per rimuovere completamente: DROP TABLE ai_* CASCADE;
-- ============================================================================

-- ============================================================================
-- AI AGENT CONFIG (un agente per artista, configurato dallo staff)
-- ============================================================================

CREATE TABLE ai_agent_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL UNIQUE REFERENCES artists(id) ON DELETE CASCADE,
  
  -- Feature flag
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Modello e parametri
  model TEXT NOT NULL DEFAULT 'deepseek-chat',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7
    CHECK (temperature BETWEEN 0 AND 2),
  max_tokens INTEGER NOT NULL DEFAULT 1024
    CHECK (max_tokens BETWEEN 100 AND 4096),
  
  -- Rate limiting
  daily_message_limit INTEGER NOT NULL DEFAULT 20
    CHECK (daily_message_limit BETWEEN 1 AND 100),
  
  -- ========================================
  -- SEZIONI SYSTEM PROMPT (tutte opzionali)
  -- ========================================
  prompt_identity TEXT,      -- Chi è l'artista
  prompt_activity TEXT,      -- Cosa fa, progetti attuali
  prompt_ontology TEXT,      -- Valori, estetica, riferimenti
  prompt_marketing TEXT,     -- Strategia, obiettivi, tone of voice
  prompt_boundaries TEXT,    -- Cosa NON dire/fare
  prompt_extra TEXT,         -- Campo libero
  
  -- Meta
  configured_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_agent_artist ON ai_agent_configs(artist_id);

CREATE TRIGGER update_ai_agent_configs_updated_at
  BEFORE UPDATE ON ai_agent_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AI CHAT SESSIONS
-- ============================================================================

CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_sessions_artist ON ai_chat_sessions(artist_id);
CREATE INDEX idx_ai_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_sessions_active ON ai_chat_sessions(user_id, is_active) 
  WHERE is_active = TRUE;

CREATE TRIGGER update_ai_chat_sessions_updated_at
  BEFORE UPDATE ON ai_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AI CHAT MESSAGES
-- ============================================================================

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INTEGER,
  model_used TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_session ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_messages_created ON ai_chat_messages(session_id, created_at);

-- ============================================================================
-- AI DAILY USAGE (rate limiting)
-- ============================================================================

CREATE TABLE ai_daily_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

CREATE INDEX idx_ai_usage_lookup ON ai_daily_usage(user_id, usage_date);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_daily_usage ENABLE ROW LEVEL SECURITY;

-- AGENT CONFIGS
CREATE POLICY ai_config_select_staff ON ai_agent_configs
  FOR SELECT USING (is_staff());
CREATE POLICY ai_config_select_artist ON ai_agent_configs
  FOR SELECT USING (
    get_user_role() = 'artist'
    AND artist_id = get_user_artist_id()
  );
CREATE POLICY ai_config_insert ON ai_agent_configs
  FOR INSERT WITH CHECK (is_staff());
CREATE POLICY ai_config_update ON ai_agent_configs
  FOR UPDATE USING (is_staff());
CREATE POLICY ai_config_delete ON ai_agent_configs
  FOR DELETE USING (is_admin());

-- SESSIONS
CREATE POLICY ai_sessions_select_own ON ai_chat_sessions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY ai_sessions_select_staff ON ai_chat_sessions
  FOR SELECT USING (is_staff());
CREATE POLICY ai_sessions_insert ON ai_chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY ai_sessions_update ON ai_chat_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- MESSAGES
CREATE POLICY ai_messages_select_own ON ai_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions s
      WHERE s.id = ai_chat_messages.session_id
      AND s.user_id = auth.uid()
    )
  );
CREATE POLICY ai_messages_select_staff ON ai_chat_messages
  FOR SELECT USING (is_staff());
CREATE POLICY ai_messages_insert ON ai_chat_messages
  FOR INSERT WITH CHECK (TRUE); -- Via Edge Function (service role)

-- DAILY USAGE
CREATE POLICY ai_usage_select_own ON ai_daily_usage
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY ai_usage_select_staff ON ai_daily_usage
  FOR SELECT USING (is_staff());
CREATE POLICY ai_usage_insert ON ai_daily_usage
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY ai_usage_update ON ai_daily_usage
  FOR UPDATE USING (TRUE);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Quanti messaggi rimangono oggi?
CREATE OR REPLACE FUNCTION get_ai_remaining_messages()
RETURNS JSONB AS $$
DECLARE
  v_artist_id UUID;
  v_limit INTEGER;
  v_used INTEGER;
  v_enabled BOOLEAN;
BEGIN
  SELECT id INTO v_artist_id FROM artists WHERE user_id = auth.uid();
  
  IF v_artist_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_an_artist');
  END IF;
  
  SELECT daily_message_limit, is_enabled 
  INTO v_limit, v_enabled
  FROM ai_agent_configs 
  WHERE artist_id = v_artist_id;
  
  IF v_limit IS NULL THEN
    RETURN jsonb_build_object('error', 'no_agent_configured');
  END IF;
  
  IF NOT v_enabled THEN
    RETURN jsonb_build_object('error', 'agent_disabled');
  END IF;
  
  SELECT COALESCE(message_count, 0) INTO v_used
  FROM ai_daily_usage
  WHERE user_id = auth.uid() AND usage_date = CURRENT_DATE;
  
  v_used := COALESCE(v_used, 0);
  
  RETURN jsonb_build_object(
    'daily_limit', v_limit,
    'used_today', v_used,
    'remaining', GREATEST(v_limit - v_used, 0),
    'is_enabled', v_enabled
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Incrementa contatore (chiamata dalla Edge Function)
CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO ai_daily_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET message_count = ai_daily_usage.message_count + 1
  RETURNING message_count INTO v_count;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-crea config (disabled) per nuovi artisti
CREATE OR REPLACE FUNCTION auto_create_ai_config()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.is_label = FALSE THEN
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

-- ============================================================================
-- ROLLBACK (se serve rimuovere tutto)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trigger_auto_create_ai_config ON artists;
-- DROP FUNCTION IF EXISTS auto_create_ai_config();
-- DROP FUNCTION IF EXISTS increment_ai_usage(UUID);
-- DROP FUNCTION IF EXISTS get_ai_remaining_messages();
-- DROP TABLE IF EXISTS ai_daily_usage;
-- DROP TABLE IF EXISTS ai_chat_messages;
-- DROP TABLE IF EXISTS ai_chat_sessions;
-- DROP TABLE IF EXISTS ai_agent_configs;
