import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Hazard = Tables<'hazards'>;

export const useRealtimeHazards = () => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const query = useQuery({
    queryKey: ['hazards', 'realtime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hazards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Hazard[];
    }
  });

  useEffect(() => {
    if (isSubscribed) return;

    const channel = supabase
      .channel('hazards_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hazards'
        },
        (payload) => {
          console.log('Hazard change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['hazards', 'realtime'] });
          queryClient.invalidateQueries({ queryKey: ['hazards'] });
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

export const useVerifiedHazards = () => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const query = useQuery({
    queryKey: ['hazards', 'verified'],
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

  useEffect(() => {
    if (isSubscribed) return;

    const channel = supabase
      .channel('verified_hazards_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hazards'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['hazards', 'verified'] });
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
