-- 67 Hub V2 — Enums + Tables

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'artist');
CREATE TYPE post_status AS ENUM ('draft', 'in_review', 'approved', 'rejected', 'published');
CREATE TYPE notification_type AS ENUM ('post_review', 'post_approved', 'post_rejected', 'post_published', 'new_guideline', 'system');
CREATE TYPE guideline_type AS ENUM ('permanent', 'campaign', 'update');

CREATE TABLE public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role         user_role NOT NULL DEFAULT 'artist',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.artists (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                        TEXT NOT NULL,
  color                       TEXT NOT NULL DEFAULT '#F5C518',
  instagram_handle            TEXT,
  tiktok_handle               TEXT,
  youtube_handle              TEXT,
  spotify_handle              TEXT,
  instagram_token             TEXT,
  instagram_token_expires_at  TIMESTAMPTZ,
  is_active                   BOOLEAN DEFAULT true,
  deactivated_at              TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        UUID NOT NULL REFERENCES public.artists(id),
  title            TEXT NOT NULL,
  caption          TEXT,
  hashtags         TEXT,
  platforms        JSONB NOT NULL DEFAULT '[]',
  status           post_status NOT NULL DEFAULT 'draft',
  scheduled_date   TIMESTAMPTZ,
  created_by       UUID NOT NULL REFERENCES public.users(id),
  approved_by      UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.post_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  file_url      TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     BIGINT,
  display_order INT DEFAULT 0,
  thumbnail_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.post_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  old_status post_status,
  new_status post_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  reason     TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id),
  type            notification_type NOT NULL,
  related_post_id UUID REFERENCES public.posts(id),
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth   TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.guideline_sections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  icon          TEXT DEFAULT 'Book',
  description   TEXT,
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.guideline_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    UUID NOT NULL REFERENCES public.guideline_sections(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  item_type     guideline_type NOT NULL DEFAULT 'permanent',
  priority      INT DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  valid_from    DATE,
  valid_until   DATE,
  display_order INT DEFAULT 0,
  created_by    UUID NOT NULL REFERENCES public.users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.guideline_item_artists (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guideline_item_id UUID NOT NULL REFERENCES public.guideline_items(id) ON DELETE CASCADE,
  artist_id         UUID REFERENCES public.artists(id) ON DELETE CASCADE,
  UNIQUE (guideline_item_id, artist_id)
);

CREATE TABLE public.guideline_reads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id),
  guideline_item_id UUID NOT NULL REFERENCES public.guideline_items(id) ON DELETE CASCADE,
  read_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, guideline_item_id)
);

CREATE TABLE public.ai_agent_configs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id                UUID UNIQUE NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  is_enabled               BOOLEAN DEFAULT true,
  provider                 TEXT DEFAULT 'openai',
  model_name               TEXT DEFAULT 'gpt-4o-mini',
  temperature              REAL DEFAULT 0.7 CHECK (temperature BETWEEN 0 AND 1),
  max_tokens               INT DEFAULT 2000,
  daily_message_limit      INT DEFAULT 20,
  system_prompt_identity   TEXT DEFAULT '',
  system_prompt_activity   TEXT DEFAULT '',
  system_prompt_ontology   TEXT DEFAULT '',
  system_prompt_marketing  TEXT DEFAULT '',
  system_prompt_boundaries TEXT DEFAULT '',
  system_prompt_extra      TEXT DEFAULT '',
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ai_chat_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id    UUID NOT NULL REFERENCES public.artists(id),
  user_id      UUID NOT NULL REFERENCES public.users(id),
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ai_daily_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id),
  usage_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INT DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

CREATE OR REPLACE VIEW public.posts_with_details AS
SELECT
  p.*,
  a.name AS artist_name,
  a.color AS artist_color,
  COALESCE(m.media_count, 0) AS media_count,
  COALESCE(c.comment_count, 0) AS comment_count
FROM public.posts p
JOIN public.artists a ON a.id = p.artist_id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS media_count FROM public.post_media GROUP BY post_id
) m ON m.post_id = p.id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS comment_count FROM public.post_comments GROUP BY post_id
) c ON c.post_id = p.id;
