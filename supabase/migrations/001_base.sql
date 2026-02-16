-- ============================================================================
-- 67 Hub - Migration v2: Semplificazione + Guidelines
-- ============================================================================
-- Questa migration:
-- 1. Rimuove chat/conversations (non più necessarie)
-- 2. Rimuove views non necessarie
-- 3. Aggiunge il sistema Guidelines/Toolkit
-- 4. Aggiunge storage bucket per allegati guidelines
-- ============================================================================

-- ============================================================================
-- STEP 1: PULIZIA - Rimuovi ciò che non serve
-- ============================================================================

-- Drop views che non servono più
DROP VIEW IF EXISTS conversations_with_preview;
DROP VIEW IF EXISTS dashboard_stats;
DROP VIEW IF EXISTS artist_stats;

-- Drop triggers relativi alla chat
DROP TRIGGER IF EXISTS trigger_notify_chat_message ON chat_messages;
DROP FUNCTION IF EXISTS notify_chat_message();

-- Drop tabelle chat (ordine: prima i messaggi, poi le conversazioni)
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS conversations;

-- Drop funzioni chat non più necessarie
DROP FUNCTION IF EXISTS get_unread_message_count(UUID);
DROP FUNCTION IF EXISTS mark_conversation_read(UUID);

-- Drop trigger auto-creazione conversazione artista
DROP TRIGGER IF EXISTS trigger_create_artist_conversation ON artists;
DROP FUNCTION IF EXISTS create_artist_conversation();

-- Rimuovi il tipo notifica 'chat_message' se vuoi (opzionale - ALTER TYPE è complicato in PG)
-- Lo lasciamo per ora, semplicemente non verrà usato

-- ============================================================================
-- STEP 2: GUIDELINES - Sezioni
-- ============================================================================

CREATE TABLE guideline_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📌',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guideline_sections_sort ON guideline_sections(sort_order);

-- Trigger updated_at
CREATE TRIGGER update_guideline_sections_updated_at
  BEFORE UPDATE ON guideline_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 3: GUIDELINES - Items (regole e indicazioni)
-- ============================================================================

CREATE TABLE guideline_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES guideline_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  item_type TEXT NOT NULL DEFAULT 'permanent'
    CHECK (item_type IN ('permanent', 'campaign')),
  priority INTEGER NOT NULL DEFAULT 0
    CHECK (priority BETWEEN 0 AND 2),  -- 0=normale, 1=importante, 2=urgente
  
  -- Validità temporale (solo per campaign)
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  
  -- Targeting
  target_all BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Allegato singolo (semplice per v1)
  attachment_url TEXT,
  attachment_name TEXT,
  
  -- Meta
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: valid_from < valid_until se entrambi presenti
  CONSTRAINT valid_date_range CHECK (
    valid_from IS NULL OR valid_until IS NULL OR valid_from < valid_until
  )
);

CREATE INDEX idx_guideline_items_section ON guideline_items(section_id);
CREATE INDEX idx_guideline_items_type ON guideline_items(item_type);
CREATE INDEX idx_guideline_items_sort ON guideline_items(section_id, priority DESC, created_at DESC);
CREATE INDEX idx_guideline_items_validity ON guideline_items(valid_from, valid_until) 
  WHERE item_type = 'campaign';

-- Trigger updated_at
CREATE TRIGGER update_guideline_items_updated_at
  BEFORE UPDATE ON guideline_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 4: GUIDELINES - Targeting per artista
-- ============================================================================

CREATE TABLE guideline_item_artists (
  guideline_item_id UUID NOT NULL REFERENCES guideline_items(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  PRIMARY KEY (guideline_item_id, artist_id)
);

CREATE INDEX idx_gia_artist ON guideline_item_artists(artist_id);

-- ============================================================================
-- STEP 5: GUIDELINES - Read tracking
-- ============================================================================

CREATE TABLE guideline_reads (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guideline_item_id UUID NOT NULL REFERENCES guideline_items(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, guideline_item_id)
);

-- ============================================================================
-- STEP 6: RLS Policies per Guidelines
-- ============================================================================

ALTER TABLE guideline_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE guideline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE guideline_item_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE guideline_reads ENABLE ROW LEVEL SECURITY;

-- SECTIONS: tutti leggono, solo staff scrive
CREATE POLICY guideline_sections_select ON guideline_sections
  FOR SELECT USING (TRUE);
CREATE POLICY guideline_sections_insert ON guideline_sections
  FOR INSERT WITH CHECK (is_staff());
CREATE POLICY guideline_sections_update ON guideline_sections
  FOR UPDATE USING (is_staff());
CREATE POLICY guideline_sections_delete ON guideline_sections
  FOR DELETE USING (is_admin());

-- ITEMS: staff vede tutto, artisti vedono solo ciò che li riguarda
CREATE POLICY guideline_items_select_staff ON guideline_items
  FOR SELECT USING (is_staff());

CREATE POLICY guideline_items_select_artist ON guideline_items
  FOR SELECT USING (
    get_user_role() = 'artist'
    AND (
      target_all = TRUE
      OR EXISTS (
        SELECT 1 FROM guideline_item_artists gia
        WHERE gia.guideline_item_id = guideline_items.id
        AND gia.artist_id = get_user_artist_id()
      )
    )
    AND (
      item_type = 'permanent'
      OR (
        (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
      )
    )
  );

CREATE POLICY guideline_items_insert ON guideline_items
  FOR INSERT WITH CHECK (is_staff());
CREATE POLICY guideline_items_update ON guideline_items
  FOR UPDATE USING (is_staff());
CREATE POLICY guideline_items_delete ON guideline_items
  FOR DELETE USING (is_staff());

-- ITEM ARTISTS: tutti leggono (serve per la join), solo staff scrive
CREATE POLICY gia_select ON guideline_item_artists
  FOR SELECT USING (TRUE);
CREATE POLICY gia_insert ON guideline_item_artists
  FOR INSERT WITH CHECK (is_staff());
CREATE POLICY gia_delete ON guideline_item_artists
  FOR DELETE USING (is_staff());

-- READS: utente legge/scrive i propri, staff legge tutti
CREATE POLICY guideline_reads_select_own ON guideline_reads
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY guideline_reads_select_staff ON guideline_reads
  FOR SELECT USING (is_staff());
CREATE POLICY guideline_reads_insert ON guideline_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY guideline_reads_delete ON guideline_reads
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- STEP 7: View per Guidelines con stato lettura
-- ============================================================================

CREATE OR REPLACE VIEW guideline_items_full AS
SELECT 
  gi.*,
  gs.title AS section_title,
  gs.slug AS section_slug,
  gs.icon AS section_icon,
  gs.sort_order AS section_sort_order,
  u.display_name AS created_by_name,
  EXISTS (
    SELECT 1 FROM guideline_reads gr 
    WHERE gr.guideline_item_id = gi.id 
    AND gr.user_id = auth.uid()
  ) AS is_read
FROM guideline_items gi
JOIN guideline_sections gs ON gi.section_id = gs.id
JOIN users u ON gi.created_by = u.id;

-- ============================================================================
-- STEP 8: Funzioni helper per Guidelines
-- ============================================================================

-- Conta items non letti per sezione (per l'artista)
CREATE OR REPLACE FUNCTION get_unread_guidelines_count(p_section_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM guideline_items gi
  WHERE (p_section_id IS NULL OR gi.section_id = p_section_id)
  AND NOT EXISTS (
    SELECT 1 FROM guideline_reads gr
    WHERE gr.guideline_item_id = gi.id
    AND gr.user_id = auth.uid()
  )
  -- Solo items visibili all'utente (la RLS si occupa del resto)
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Segna un item come letto
CREATE OR REPLACE FUNCTION mark_guideline_read(p_item_id UUID)
RETURNS VOID AS $$
  INSERT INTO guideline_reads (user_id, guideline_item_id)
  VALUES (auth.uid(), p_item_id)
  ON CONFLICT (user_id, guideline_item_id) DO NOTHING;
$$ LANGUAGE sql SECURITY DEFINER;

-- Segna tutti gli items di una sezione come letti
CREATE OR REPLACE FUNCTION mark_section_read(p_section_id UUID)
RETURNS VOID AS $$
  INSERT INTO guideline_reads (user_id, guideline_item_id)
  SELECT auth.uid(), gi.id
  FROM guideline_items gi
  WHERE gi.section_id = p_section_id
  ON CONFLICT (user_id, guideline_item_id) DO NOTHING;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- STEP 9: Storage bucket per allegati guidelines
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guideline-attachments',
  'guideline-attachments',
  TRUE,
  20971520, -- 20MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4'
  ]
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
CREATE POLICY storage_guidelines_select ON storage.objects
  FOR SELECT USING (bucket_id = 'guideline-attachments');

CREATE POLICY storage_guidelines_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'guideline-attachments'
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY storage_guidelines_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'guideline-attachments'
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- ============================================================================
-- STEP 10: Seed data per le sezioni default
-- ============================================================================

-- Queste sezioni vengono create di default, lo staff può modificarle dopo
-- Il created_by usa l'admin di test, in produzione andrà cambiato
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Prendi il primo admin disponibile
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
  
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO guideline_sections (title, slug, description, icon, sort_order, created_by)
    VALUES 
      ('Stories', 'stories', 'Regole e indicazioni per le Instagram/TikTok Stories', '📱', 1, v_admin_id),
      ('Feed & Post', 'feed-post', 'Linee guida per i post nel feed', '📸', 2, v_admin_id),
      ('Reels & TikTok', 'reels-tiktok', 'Best practice per contenuti video brevi', '🎬', 3, v_admin_id),
      ('Generale', 'generale', 'Branding, tone of voice, regole generali', '📋', 4, v_admin_id)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;
