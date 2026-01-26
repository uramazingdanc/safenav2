import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VerificationSubmission {
  file: File;
}

interface VerificationReview {
  userId: string;
  approved: boolean;
  adminNotes?: string;
}

// Upload ID and submit for verification
export const useSubmitVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file }: VerificationSubmission) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to storage bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification_ids')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the URL
      const { data: urlData } = supabase.storage
        .from('verification_ids')
        .getPublicUrl(fileName);

      // Update profile with pending status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          id_image_url: fileName,
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

// Admin: Review verification (approve/reject)
export const useReviewVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, approved, adminNotes }: VerificationReview) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates: Record<string, unknown> = {
        verification_status: approved ? 'verified' : 'rejected',
        is_verified: approved,
        verification_reviewed_at: new Date().toISOString(),
        verification_reviewed_by: user.id,
        admin_notes: adminNotes || null
      };

      // If rejected, clear the image URL so user can try again
      if (!approved) {
        updates.id_image_url = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      // If rejected, also delete the image from storage
      if (!approved) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id_image_url')
          .eq('user_id', userId)
          .single();

        if (profile?.id_image_url) {
          await supabase.storage
            .from('verification_ids')
            .remove([profile.id_image_url]);
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
