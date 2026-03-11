-- Allow users to read their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (related_user_id = auth.uid());

-- Allow system (security definer functions) to insert notifications for users
-- The existing insert policy requires admin, but our triggers use SECURITY DEFINER so they bypass RLS