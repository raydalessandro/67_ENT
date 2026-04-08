CREATE OR REPLACE FUNCTION validate_post_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;
  IF (OLD.status = 'draft' AND NEW.status = 'in_review') OR
     (OLD.status = 'in_review' AND NEW.status IN ('approved', 'rejected')) OR
     (OLD.status = 'rejected' AND NEW.status = 'draft') OR
     (OLD.status = 'approved' AND NEW.status = 'published') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;
