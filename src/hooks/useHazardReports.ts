import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type HazardReport = Tables<'hazard_reports'>;
type HazardReportInsert = TablesInsert<'hazard_reports'>;
type HazardReportUpdate = TablesUpdate<'hazard_reports'>;

export const useHazardReports = () => {
  return useQuery({
    queryKey: ['hazard_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hazard_reports')
        .select(`
          *,
          profiles:reporter_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
};

export const useMyHazardReports = () => {
  return useQuery({
    queryKey: ['hazard_reports', 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('hazard_reports')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HazardReport[];
    }
  });
};

export const usePendingReports = () => {
  return useQuery({
    queryKey: ['hazard_reports', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hazard_reports')
        .select(`
          *,
          profiles:reporter_id(full_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
};

export const useCreateHazardReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: Omit<HazardReportInsert, 'reporter_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hazard_reports')
        .insert({ ...report, reporter_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazard_reports'] });
    }
  });
};

export const useUpdateHazardReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: HazardReportUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('hazard_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazard_reports'] });
    }
  });
};
