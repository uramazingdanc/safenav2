import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type EvacuationCenter = Tables<'evacuation_centers'>;
type EvacuationCenterInsert = TablesInsert<'evacuation_centers'>;
type EvacuationCenterUpdate = TablesUpdate<'evacuation_centers'>;

export const useEvacuationCenters = () => {
  return useQuery({
    queryKey: ['evacuation_centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evacuation_centers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as EvacuationCenter[];
    }
  });
};

export const useOpenEvacuationCenters = () => {
  return useQuery({
    queryKey: ['evacuation_centers', 'open'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evacuation_centers')
        .select('*')
        .in('status', ['open', 'standby'])
        .order('name', { ascending: true });

      if (error) throw error;
      return data as EvacuationCenter[];
    }
  });
};

export const useCreateEvacuationCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (center: EvacuationCenterInsert) => {
      const { data, error } = await supabase
        .from('evacuation_centers')
        .insert(center)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evacuation_centers'] });
    }
  });
};

export const useUpdateEvacuationCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EvacuationCenterUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('evacuation_centers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evacuation_centers'] });
    }
  });
};

export const useDeleteEvacuationCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('evacuation_centers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evacuation_centers'] });
    }
  });
};
