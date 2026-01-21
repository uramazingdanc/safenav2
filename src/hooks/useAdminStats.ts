import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      // Fetch counts in parallel
      const [profilesResult, hazardsResult, centersResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('hazards').select('id', { count: 'exact', head: true }),
        supabase.from('evacuation_centers').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: profilesResult.count ?? 0,
        totalHazards: hazardsResult.count ?? 0,
        totalEvacCenters: centersResult.count ?? 0,
      };
    }
  });
};
