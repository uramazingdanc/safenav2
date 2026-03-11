-- Trigger: Notify user when their verification status changes (approved/rejected)
CREATE OR REPLACE FUNCTION public.notify_user_verification_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (OLD.verification_status IS DISTINCT FROM NEW.verification_status) 
     AND NEW.verification_status IN ('verified', 'rejected') THEN
    
    INSERT INTO public.notifications (
      message, type, priority, related_user_id, related_entity_id, related_entity_type, metadata
    ) VALUES (
      CASE 
        WHEN NEW.verification_status = 'verified' 
        THEN 'Your ID verification has been approved! You can now report hazards.'
        ELSE 'Your ID verification was rejected. Reason: ' || COALESCE(NEW.admin_notes, 'Not specified')
      END,
      CASE WHEN NEW.verification_status = 'verified' THEN 'success' ELSE 'warning' END,
      'high',
      NEW.user_id,
      NEW.id,
      'verification_result',
      jsonb_build_object(
        'status', NEW.verification_status,
        'user_name', NEW.full_name,
        'admin_notes', COALESCE(NEW.admin_notes, '')
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_verification_result
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_verification_result();