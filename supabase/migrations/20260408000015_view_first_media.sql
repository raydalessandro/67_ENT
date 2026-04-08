-- Add first_media_url and first_media_type to posts_with_details view
-- so the calendar (and other list views) can show thumbnails.

CREATE OR REPLACE VIEW public.posts_with_details AS
SELECT
  p.*,
  a.name AS artist_name,
  a.color AS artist_color,
  COALESCE(m.media_count, 0) AS media_count,
  COALESCE(c.comment_count, 0) AS comment_count,
  fm.first_media_url,
  fm.first_media_type
FROM public.posts p
JOIN public.artists a ON a.id = p.artist_id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS media_count FROM public.post_media GROUP BY post_id
) m ON m.post_id = p.id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS comment_count FROM public.post_comments GROUP BY post_id
) c ON c.post_id = p.id
LEFT JOIN LATERAL (
  SELECT pm.file_url AS first_media_url, pm.file_type AS first_media_type
  FROM public.post_media pm
  WHERE pm.post_id = p.id
  ORDER BY pm.display_order, pm.created_at
  LIMIT 1
) fm ON true;
