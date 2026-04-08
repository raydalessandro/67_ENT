CREATE OR REPLACE FUNCTION create_artist_atomic(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_color TEXT DEFAULT '#F5C518',
  p_instagram_handle TEXT DEFAULT NULL,
  p_tiktok_handle TEXT DEFAULT NULL,
  p_youtube_handle TEXT DEFAULT NULL,
  p_spotify_handle TEXT DEFAULT NULL,
  p_instagram_token TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_artist_id UUID;
BEGIN
  INSERT INTO public.users (id, email, display_name, role)
  VALUES (p_user_id, p_email, p_name, 'artist')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.artists (user_id, name, color, instagram_handle, tiktok_handle, youtube_handle, spotify_handle, instagram_token)
  VALUES (p_user_id, p_name, p_color, p_instagram_handle, p_tiktok_handle, p_youtube_handle, p_spotify_handle, p_instagram_token)
  RETURNING id INTO new_artist_id;
  RETURN new_artist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
