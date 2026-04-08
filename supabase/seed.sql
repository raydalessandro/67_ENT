-- 67 Hub V2 — Seed Data
-- Creates: 1 admin, 1 manager, 2 artists, sample posts, guidelines, AI configs

-- ══════════════════════════════════════════
-- AUTH USERS
-- GoTrue requires ALL string columns non-NULL and timestamps set.
-- ══════════════════════════════════════════

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, instance_id,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, phone_change, phone_change_token,
  created_at, updated_at, last_sign_in_at, is_sso_user, is_anonymous)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@67ent.com',
   crypt('admin123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '00000000-0000-0000-0000-000000000000',
   '{"provider":"email","providers":["email"]}', '{}',
   '', '', '', '', '', '', '', '',
   now(), now(), now(), false, false),

  ('a0000000-0000-0000-0000-000000000002', 'manager@67ent.com',
   crypt('manager123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '00000000-0000-0000-0000-000000000000',
   '{"provider":"email","providers":["email"]}', '{}',
   '', '', '', '', '', '', '', '',
   now(), now(), now(), false, false),

  ('a0000000-0000-0000-0000-000000000003', 'sliceg@67ent.com',
   crypt('artist123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '00000000-0000-0000-0000-000000000000',
   '{"provider":"email","providers":["email"]}', '{}',
   '', '', '', '', '', '', '', '',
   now(), now(), now(), false, false),

  ('a0000000-0000-0000-0000-000000000004', 'nova@67ent.com',
   crypt('artist123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '00000000-0000-0000-0000-000000000000',
   '{"provider":"email","providers":["email"]}', '{}',
   '', '', '', '', '', '', '', '',
   now(), now(), now(), false, false);

-- ══════════════════════════════════════════
-- PUBLIC USERS
-- ══════════════════════════════════════════

INSERT INTO public.users (id, email, display_name, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@67ent.com', '67 Entertainment', 'admin'),
  ('a0000000-0000-0000-0000-000000000002', 'manager@67ent.com', 'Marco Rossi', 'manager'),
  ('a0000000-0000-0000-0000-000000000003', 'sliceg@67ent.com', 'Slice G', 'artist'),
  ('a0000000-0000-0000-0000-000000000004', 'nova@67ent.com', 'Nova', 'artist');

-- ══════════════════════════════════════════
-- ARTISTS (AI configs created by trigger)
-- ══════════════════════════════════════════

INSERT INTO public.artists (id, user_id, name, color, instagram_handle, tiktok_handle) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'Slice G', '#F5C518', 'sliceg_official', 'sliceg'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'Nova', '#FF6B6B', 'nova_music', 'nova.official');

-- ══════════════════════════════════════════
-- SAMPLE POSTS
-- ══════════════════════════════════════════

INSERT INTO public.posts (id, artist_id, title, caption, hashtags, platforms, status, scheduled_date, created_by) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Nuovo singolo - Teaser', 'Il nuovo singolo è in arrivo', '#sliceg #newsingle #67ent',
   '["instagram_feed", "tiktok"]', 'approved',
   now() + interval '3 days', 'a0000000-0000-0000-0000-000000000001'),

  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'Behind the scenes studio', 'In studio a lavorare sul nuovo progetto', '#studio #behindthescenes',
   '["instagram_story", "instagram_reel"]', 'draft',
   now() + interval '5 days', 'a0000000-0000-0000-0000-000000000002'),

  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
   'Nova - Live Performance', 'Prossimo live questo weekend!', '#nova #live #67entertainment',
   '["instagram_feed", "youtube"]', 'in_review',
   now() + interval '2 days', 'a0000000-0000-0000-0000-000000000001'),

  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002',
   'Collab announcement', 'Qualcosa di grande sta per arrivare...', '#collab #surprise',
   '["instagram_feed", "tiktok", "youtube"]', 'published',
   now() - interval '2 days', 'a0000000-0000-0000-0000-000000000002');

-- ══════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════

INSERT INTO public.post_comments (post_id, user_id, content) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'Mi piace molto il teaser! Approviamo?'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Perfetto, mandiamo per approvazione.');

-- ══════════════════════════════════════════
-- TOOLKIT
-- ══════════════════════════════════════════

INSERT INTO public.guideline_sections (id, title, slug, icon, description, display_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Brand Guidelines', 'brand-guidelines', 'Palette', 'Regole di branding e identita visiva', 0),
  ('d0000000-0000-0000-0000-000000000002', 'Social Media Tips', 'social-media-tips', 'TrendingUp', 'Consigli per i social media', 1),
  ('d0000000-0000-0000-0000-000000000003', 'Campagne Attive', 'campagne-attive', 'Target', 'Campagne in corso', 2);

INSERT INTO public.guideline_items (section_id, title, content, item_type, priority, created_by) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Logo Usage', 'Il logo 67 deve essere sempre su sfondo scuro. Non modificare i colori o le proporzioni.', 'permanent', 5, 'a0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000001', 'Palette Colori', 'Colori principali: Gold #F5C518, Dark #0F0F1A. Colori secondari: vedi guida completa.', 'permanent', 4, 'a0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'Best Practices Instagram', 'Pubblica almeno 3 volte a settimana. Usa Reel per maggiore engagement. Rispondi ai commenti entro 1 ora.', 'permanent', 3, 'a0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000003', 'Lancio Album Slice G', 'Campagna attiva dal 1 al 30 del mese. Usare hashtag #SliceGAlbum in tutti i post.', 'campaign', 5, 'a0000000-0000-0000-0000-000000000001');

-- ══════════════════════════════════════════
-- AI CONFIG UPDATES
-- ══════════════════════════════════════════

UPDATE public.ai_agent_configs SET
  system_prompt_identity = 'Sei l''assistente personale di Slice G, artista della 67 Entertainment.',
  system_prompt_activity = 'Slice G e un rapper italiano emergente. Sta lavorando al suo primo album.',
  system_prompt_marketing = 'Promuovi sempre i contenuti con entusiasmo. Usa un tono giovane e urbano.',
  system_prompt_boundaries = 'Non parlare di altri artisti in modo negativo. Non dare consigli legali o finanziari.'
WHERE artist_id = 'b0000000-0000-0000-0000-000000000001';

UPDATE public.ai_agent_configs SET
  system_prompt_identity = 'Sei l''assistente personale di Nova, artista della 67 Entertainment.',
  system_prompt_activity = 'Nova e una cantante pop italiana. Sta preparando il suo tour estivo.',
  system_prompt_marketing = 'Tono elegante e professionale. Focus su musica e performance.',
  system_prompt_boundaries = 'Non rivelare dettagli del contratto. Non parlare di gossip.'
WHERE artist_id = 'b0000000-0000-0000-0000-000000000002';
