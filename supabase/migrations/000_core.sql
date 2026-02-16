-- ============================================================================
-- 67 Hub — 000: Core Schema
-- Eseguire PRIMA di tutte le altre migrazioni
-- ============================================================================

-- ── Users ──
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'artist' CHECK (role IN ('admin', 'manager', 'artist')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select ON users FOR SELECT USING (true);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

-- ── Artists ──
CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  bio TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  youtube_handle TEXT,
  spotify_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY artists_select ON artists FOR SELECT USING (true);
CREATE POLICY artists_insert ON artists FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));
CREATE POLICY artists_update ON artists FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE INDEX idx_artists_user_id ON artists(user_id);

-- ── Posts ──
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT,
  platform TEXT NOT NULL DEFAULT 'instagram_feed'
    CHECK (platform IN ('instagram_feed', 'instagram_story', 'instagram_reel', 'tiktok', 'youtube', 'youtube_short', 'spotify', 'other')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_review', 'approved', 'rejected', 'published')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Artista vede i propri post, staff vede tutti
CREATE POLICY posts_select ON posts FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  OR artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid())
);
CREATE POLICY posts_insert ON posts FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));
CREATE POLICY posts_update ON posts FOR UPDATE USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  OR artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid())
);
CREATE POLICY posts_delete ON posts FOR DELETE
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE INDEX idx_posts_artist ON posts(artist_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled ON posts(scheduled_at);

-- ── Post Media ──
CREATE TABLE IF NOT EXISTS post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  mime_type TEXT NOT NULL,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  duration_seconds NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0,
  thumbnail_status TEXT DEFAULT 'pending'
    CHECK (thumbnail_status IN ('pending', 'processing', 'ready', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_media_select ON post_media FOR SELECT USING (
  post_id IN (SELECT id FROM posts)
);
CREATE POLICY post_media_insert ON post_media FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));
CREATE POLICY post_media_delete ON post_media FOR DELETE
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE INDEX idx_post_media_post ON post_media(post_id);

-- ── Post Comments ──
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_comments_select ON post_comments FOR SELECT USING (
  post_id IN (SELECT id FROM posts)
);
CREATE POLICY post_comments_insert ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_post_comments_post ON post_comments(post_id);

-- ── Post History ──
CREATE TABLE IF NOT EXISTS post_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_history_select ON post_history FOR SELECT USING (
  post_id IN (SELECT id FROM posts)
);

CREATE INDEX idx_post_history_post ON post_history(post_id);

-- ── Trigger: log status transitions ──
CREATE OR REPLACE FUNCTION log_post_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO post_history (post_id, changed_by, old_status, new_status, note)
    VALUES (
      NEW.id,
      auth.uid(),
      OLD.status,
      NEW.status,
      CASE WHEN NEW.status = 'rejected' THEN NEW.rejection_reason ELSE NULL END
    );
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_post_status_change
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION log_post_status_change();

-- ── Trigger: validate status transitions ──
CREATE OR REPLACE FUNCTION validate_post_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Valid transitions
    IF NOT (
      (OLD.status = 'draft' AND NEW.status = 'in_review') OR
      (OLD.status = 'in_review' AND NEW.status IN ('approved', 'rejected')) OR
      (OLD.status = 'approved' AND NEW.status = 'published') OR
      (OLD.status = 'rejected' AND NEW.status = 'draft')
    ) THEN
      RAISE EXCEPTION 'invalid_status_transition:% → %', OLD.status, NEW.status;
    END IF;

    -- Rejection requires reason
    IF NEW.status = 'rejected' AND (NEW.rejection_reason IS NULL OR NEW.rejection_reason = '') THEN
      RAISE EXCEPTION 'rejection_reason_required';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_validate_post_transition
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_post_transition();

-- ── Notifications ──
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('post_review', 'post_approved', 'post_rejected', 'post_comment', 'new_guideline', 'ai_message')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ── Calendar View ──
CREATE OR REPLACE VIEW calendar_events AS
SELECT
  p.id,
  p.title,
  p.status,
  p.platform,
  p.scheduled_at,
  p.artist_id,
  a.name AS artist_name,
  a.color AS artist_color
FROM posts p
JOIN artists a ON p.artist_id = a.id
ORDER BY p.scheduled_at;

-- ── Updated_at trigger for users and artists ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
