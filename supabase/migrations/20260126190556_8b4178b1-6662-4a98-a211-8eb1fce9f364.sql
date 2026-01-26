-- Create storage bucket for verification IDs
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification_ids', 'verification_ids', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Authenticated users can upload their own ID
CREATE POLICY "Users can upload their own verification ID"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification_ids' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own uploads
CREATE POLICY "Users can view their own verification ID"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification_ids' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete/replace their own uploads
CREATE POLICY "Users can delete their own verification ID"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification_ids' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all verification IDs
CREATE POLICY "Admins can view all verification IDs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification_ids' 
  AND is_admin_or_moderator(auth.uid())
);

-- Add verification columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS id_image_url TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_reviewed_by UUID;

-- Migrate existing is_verified data to new status
UPDATE public.profiles
SET verification_status = CASE 
  WHEN is_verified = true THEN 'verified'
  ELSE 'unverified'
END
WHERE verification_status IS NULL OR verification_status = 'unverified';

-- Create index for filtering pending verifications
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);

-- Update RLS: Admins can update verification fields
CREATE POLICY "Admins can update verification status"
ON public.profiles FOR UPDATE
TO authenticated
USING (is_admin_or_moderator(auth.uid()))
WITH CHECK (is_admin_or_moderator(auth.uid()));