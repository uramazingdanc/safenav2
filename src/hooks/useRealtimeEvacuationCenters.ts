import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type EvacuationCenter = Tables<'evacuation_centers'>;
type EvacuationCenterInsert = TablesInsert<'evacuation_centers'>;
type EvacuationCenterUpdate = TablesUpdate<'evacuation_centers'>;

export const useRealtimeEvacuationCenters = () => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const query = useQuery({
    queryKey: ['evacuation_centers', 'realtime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evacuation_centers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as EvacuationCenter[];
    }
  });

  useEffect(() => {
    if (isSubscribed) return;

    const channel = supabase
      .channel('evac_centers_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evacuation_centers'
        },
        (payload) => {
          console.log('Evacuation center change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['evacuation_centers', 'realtime'] });
          queryClient.invalidateQueries({ queryKey: ['evacuation_centers'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [queryClient, isSubscribed]);

  return query;
};

export const useCreateEvacCenter = () => {
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

export const useUpdateEvacCenter = () => {
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

export const useDeleteEvacCenter = () => {
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
