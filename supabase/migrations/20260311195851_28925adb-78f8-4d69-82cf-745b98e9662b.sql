-- Trigger: Notify user when their hazard report status changes
CREATE OR REPLACE FUNCTION public.notify_user_report_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('verified', 'rejected') THEN
    INSERT INTO public.notifications (
      message, type, priority, related_user_id, related_entity_id, related_entity_type, metadata
    ) VALUES (
      CASE 
        WHEN NEW.status = 'verified' 
        THEN 'Your ' || NEW.hazard_type || ' report at ' || NEW.location || ' has been approved.'
        ELSE 'Your ' || NEW.hazard_type || ' report at ' || NEW.location || ' was rejected.'
      END,
      CASE WHEN NEW.status = 'verified' THEN 'success' ELSE 'warning' END,
      'medium',
      NEW.reporter_id,
      NEW.id,
      'report_result',
      jsonb_build_object(
        'hazard_type', NEW.hazard_type,
        'location', NEW.location,
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_report_result
  AFTER UPDATE ON public.hazard_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_report_result();