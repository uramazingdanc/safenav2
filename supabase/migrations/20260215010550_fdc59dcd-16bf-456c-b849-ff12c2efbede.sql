-- Add UPDATE policies for storage objects (required for upsert: true)
CREATE POLICY "Users can update their own hazard photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hazard_photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own verification ID"
ON storage.objects FOR UPDATE
USING (bucket_id = 'verification_ids' AND (auth.uid())::text = (storage.foldername(name))[1]);