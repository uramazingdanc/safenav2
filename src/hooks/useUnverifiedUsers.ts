import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUnverifiedUsers = () => {
  return useQuery({
    queryKey: ['profiles', 'unverified'],
    queryFn: async () => {
      // Use rpc or raw query to handle the new column that's not in types yet
      const { data, error } = await supabase
        .rpc('get_unverified_profiles' as never)
        .select('*');

      // Fallback to regular query with type assertion if RPC doesn't exist
      if (error) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profileError) throw profileError;
        
        // Filter unverified profiles client-side
        return (profiles || []).filter((p: any) => p.is_verified === false);
      }
      return data;
    }
  });
};

export const useVerifyUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Use raw update with type assertion for new column
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true } as never)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
};
