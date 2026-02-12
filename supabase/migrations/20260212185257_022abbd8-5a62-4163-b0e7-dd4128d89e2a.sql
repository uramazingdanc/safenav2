
-- Create a public bucket for hazard report photos
INSERT INTO storage.buckets (id, name, public) VALUES ('hazard_photos', 'hazard_photos', true);

-- Allow authenticated users to upload photos to their own folder
CREATE POLICY "Users can upload hazard photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hazard_photos' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow anyone to view hazard photos (public bucket)
CREATE POLICY "Anyone can view hazard photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'hazard_photos');

-- Allow users to delete their own hazard photos
CREATE POLICY "Users can delete their own hazard photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hazard_photos' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
