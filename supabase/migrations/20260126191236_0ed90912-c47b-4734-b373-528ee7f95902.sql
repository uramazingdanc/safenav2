-- Create notifications table for admin alerts
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('alert', 'info', 'warning', 'success')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_user_id UUID,
  related_entity_id UUID,
  related_entity_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (is_admin_or_moderator(auth.uid()));

-- Only admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (is_admin_or_moderator(auth.uid()));

-- System/triggers can insert notifications (using service role)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_moderator(auth.uid()));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create index for faster queries
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Create function to generate notification on new hazard report
CREATE OR REPLACE FUNCTION public.notify_new_hazard_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reporter_name TEXT;
BEGIN
  -- Get reporter name
  SELECT full_name INTO reporter_name
  FROM public.profiles
  WHERE user_id = NEW.reporter_id;

  -- Insert notification
  INSERT INTO public.notifications (message, type, priority, related_user_id, related_entity_id, related_entity_type, metadata)
  VALUES (
    'New ' || NEW.hazard_type || ' report submitted at ' || NEW.location,
    'warning',
    'medium',
    NEW.reporter_id,
    NEW.id,
    'hazard_report',
    jsonb_build_object('hazard_type', NEW.hazard_type, 'location', NEW.location, 'reporter_name', COALESCE(reporter_name, 'Unknown'))
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new hazard reports
CREATE TRIGGER on_new_hazard_report
AFTER INSERT ON public.hazard_reports
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_hazard_report();

-- Create function to notify on verification request
CREATE OR REPLACE FUNCTION public.notify_verification_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status changes to 'pending'
  IF NEW.verification_status = 'pending' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'pending') THEN
    INSERT INTO public.notifications (message, type, priority, related_user_id, related_entity_id, related_entity_type, metadata)
    VALUES (
      NEW.full_name || ' submitted an ID for verification',
      'info',
      'medium',
      NEW.user_id,
      NEW.id,
      'verification',
      jsonb_build_object('user_name', NEW.full_name, 'barangay', COALESCE(NEW.barangay, 'Unknown'))
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for verification requests
CREATE TRIGGER on_verification_request
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_verification_request();