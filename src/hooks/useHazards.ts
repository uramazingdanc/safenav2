import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Hazard = Tables<'hazards'>;
type HazardInsert = TablesInsert<'hazards'>;
type HazardUpdate = TablesUpdate<'hazards'>;

export const useHazards = () => {
  return useQuery({
    queryKey: ['hazards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hazards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Hazard[];
    }
  });
};

export const useActiveHazards = () => {
  return useQuery({
    queryKey: ['hazards', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hazards')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Hazard[];
    }
  });
};

export const useCreateHazard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hazard: HazardInsert) => {
      const { data, error } = await supabase
        .from('hazards')
        .insert(hazard)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazards'] });
    }
  });
};

export const useUpdateHazard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: HazardUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('hazards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazards'] });
    }
  });
};

export const useDeleteHazard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hazards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazards'] });
    }
  });
};
