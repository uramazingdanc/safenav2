-- Add selfie_image_url column for face verification
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS selfie_image_url TEXT;