import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VerificationSubmission {
  idFile: File;
  selfieFile: File;
}

interface VerificationReview {
  userId: string;
  approved: boolean;
  adminNotes?: string;
}

// Upload ID and selfie, then submit for verification
export const useSubmitVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ idFile, selfieFile }: VerificationSubmission) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload ID image
      const idExt = idFile.name.split('.').pop();
      const idFileName = `${user.id}/${Date.now()}_id.${idExt}`;

      const { error: idUploadError } = await supabase.storage
        .from('verification_ids')
        .upload(idFileName, idFile, { upsert: true });

      if (idUploadError) throw idUploadError;

      // Upload selfie image
      const selfieExt = selfieFile.name.split('.').pop();
      const selfieFileName = `${user.id}/${Date.now()}_selfie.${selfieExt}`;

      const { error: selfieUploadError } = await supabase.storage
        .from('verification_ids')
        .upload(selfieFileName, selfieFile, { upsert: true });

      if (selfieUploadError) throw selfieUploadError;

      // Update profile with pending status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          id_image_url: idFileName,
          selfie_image_url: selfieFileName,
          verification_submitted_at: new Date().toISOString(),
          admin_notes: null
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
};

// Admin: Get pending verification requests
export const usePendingVerifications = () => {
  return useQuery({
    queryKey: ['verifications', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('verification_status', 'pending')
        .order('verification_submitted_at', { ascending: true });

      if (error) throw error;
      return data;
    }
  });
};

// Admin: Get verification image URL (signed URL for private bucket)
export const useVerificationImage = (imagePath: string | null) => {
  return useQuery({
    queryKey: ['verification-image', imagePath],
    queryFn: async () => {
      if (!imagePath) return null;

      const { data, error } = await supabase.storage
        .from('verification_ids')
        .createSignedUrl(imagePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!imagePath
  });
};

// Admin: Get both verification images (ID and selfie)
export const useVerificationImages = (idPath: string | null, selfiePath: string | null) => {
  return useQuery({
    queryKey: ['verification-images', idPath, selfiePath],
    queryFn: async () => {
      const results: { idUrl: string | null; selfieUrl: string | null } = {
        idUrl: null,
        selfieUrl: null
      };

      if (idPath) {
        const { data } = await supabase.storage
          .from('verification_ids')
          .createSignedUrl(idPath, 3600);
        results.idUrl = data?.signedUrl || null;
      }

      if (selfiePath) {
        const { data } = await supabase.storage
          .from('verification_ids')
          .createSignedUrl(selfiePath, 3600);
        results.selfieUrl = data?.signedUrl || null;
      }

      return results;
    },
    enabled: !!idPath || !!selfiePath
  });
};

// Admin: Review verification (approve/reject)
export const useReviewVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, approved, adminNotes }: VerificationReview) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current profile data before update
      const { data: profile } = await supabase
        .from('profiles')
        .select('id_image_url, selfie_image_url')
        .eq('user_id', userId)
        .single();

      const updates: Record<string, unknown> = {
        verification_status: approved ? 'verified' : 'rejected',
        is_verified: approved,
        verification_reviewed_at: new Date().toISOString(),
        verification_reviewed_by: user.id,
        admin_notes: adminNotes || null
      };

      // If rejected, clear the image URLs so user can try again
      if (!approved) {
        updates.id_image_url = null;
        updates.selfie_image_url = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      // If rejected, also delete the images from storage
      if (!approved && profile) {
        const filesToDelete: string[] = [];
        if (profile.id_image_url) filesToDelete.push(profile.id_image_url);
        if (profile.selfie_image_url) filesToDelete.push(profile.selfie_image_url);
        
        if (filesToDelete.length > 0) {
          await supabase.storage
            .from('verification_ids')
            .remove(filesToDelete);
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    }
  });
};
