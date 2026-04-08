CREATE OR REPLACE FUNCTION deactivate_artist(p_artist_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.artists
  SET is_active = false, deactivated_at = now()
  WHERE id = p_artist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
