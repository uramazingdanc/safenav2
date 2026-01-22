import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUnverifiedUsers = () => {
  return useQuery({
    queryKey: ['profiles', 'unverified'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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
