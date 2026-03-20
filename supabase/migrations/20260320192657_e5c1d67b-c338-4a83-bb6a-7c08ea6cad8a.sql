
-- 1. Notify all users when admin adds a new hazard
CREATE OR REPLACE FUNCTION public.notify_all_users_new_hazard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'user'
  LOOP
    INSERT INTO public.notifications (message, type, priority, related_user_id, related_entity_id, related_entity_type, metadata)
    VALUES (
      'New hazard alert: ' || NEW.type || ' reported at ' || NEW.location,
      'alert',
      CASE WHEN NEW.severity IN ('high', 'critical') THEN 'high' ELSE 'medium' END,
      user_record.user_id,
      NEW.id,
      'admin_hazard_added',
      jsonb_build_object('hazard_type', NEW.type, 'location', NEW.location, 'severity', NEW.severity::text)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_all_users_new_hazard ON public.hazards;
CREATE TRIGGER trigger_notify_all_users_new_hazard
  AFTER INSERT ON public.hazards
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users_new_hazard();

-- 2. Notify all users when admin adds a new evacuation center
CREATE OR REPLACE FUNCTION public.notify_all_users_new_evac_center()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'user'
  LOOP
    INSERT INTO public.notifications (message, type, priority, related_user_id, related_entity_id, related_entity_type, metadata)
    VALUES (
      'New evacuation center opened: ' || NEW.name || ' at ' || NEW.location,
      'info',
      'medium',
      user_record.user_id,
      NEW.id,
      'evac_center_added',
      jsonb_build_object('center_name', NEW.name, 'location', NEW.location, 'capacity', NEW.capacity)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_all_users_new_evac_center ON public.evacuation_centers;
CREATE TRIGGER trigger_notify_all_users_new_evac_center
  AFTER INSERT ON public.evacuation_centers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users_new_evac_center();

-- 3. Notify all users when an evacuation center becomes full
CREATE OR REPLACE FUNCTION public.notify_all_users_evac_full()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
BEGIN
  IF NEW.status = 'full' AND (OLD.status IS DISTINCT FROM 'full') THEN
    FOR user_record IN
      SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'user'
    LOOP
      INSERT INTO public.notifications (message, type, priority, related_user_id, related_entity_id, related_entity_type, metadata)
      VALUES (
        'Evacuation center ' || NEW.name || ' is now at full capacity!',
        'warning',
        'high',
        user_record.user_id,
        NEW.id,
        'evac_center_full',
        jsonb_build_object('center_name', NEW.name, 'location', NEW.location, 'capacity', NEW.capacity, 'occupancy', NEW.current_occupancy)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_all_users_evac_full ON public.evacuation_centers;
CREATE TRIGGER trigger_notify_all_users_evac_full
  AFTER UPDATE ON public.evacuation_centers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users_evac_full();
