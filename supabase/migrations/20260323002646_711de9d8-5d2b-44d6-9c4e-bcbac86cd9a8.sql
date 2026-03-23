
CREATE OR REPLACE FUNCTION public.notify_all_users_new_evac_center()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  coord_text TEXT;
BEGIN
  coord_text := '';
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    coord_text := ' (' || round(NEW.latitude::numeric, 4)::text || ', ' || round(NEW.longitude::numeric, 4)::text || ')';
  END IF;

  FOR user_record IN
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'user'
  LOOP
    INSERT INTO public.notifications (message, type, priority, related_user_id, related_entity_id, related_entity_type, metadata)
    VALUES (
      'New evacuation center opened: ' || NEW.name || ' at ' || NEW.location || coord_text,
      'info',
      'medium',
      user_record.user_id,
      NEW.id,
      'evac_center_added',
      jsonb_build_object('center_name', NEW.name, 'location', NEW.location, 'capacity', NEW.capacity, 'latitude', NEW.latitude, 'longitude', NEW.longitude)
    );
  END LOOP;
  RETURN NEW;
END;
$$;
