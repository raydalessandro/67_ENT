-- ============================================================================
-- 67 Hub — 005: Posts with Details View
-- Aggiunge view per query complete dei post con dettagli artista e conteggi
-- ============================================================================

CREATE OR REPLACE VIEW posts_with_details AS
SELECT
  p.*,
  a.name AS artist_name,
  a.color AS artist_color,
  u.display_name AS created_by_name,
  (SELECT COUNT(*) FROM post_media WHERE post_id = p.id) AS media_count,
  (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) AS comment_count
FROM posts p
LEFT JOIN artists a ON p.artist_id = a.id
LEFT JOIN users u ON p.created_by = u.id;
