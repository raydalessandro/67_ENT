CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  r user_role;
BEGIN
  SELECT role INTO r FROM public.users WHERE id = auth.uid();
  RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
