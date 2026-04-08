CREATE OR REPLACE FUNCTION get_artist_id()
RETURNS UUID AS $$
DECLARE
  aid UUID;
BEGIN
  SELECT id INTO aid FROM public.artists WHERE user_id = auth.uid();
  RETURN aid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
