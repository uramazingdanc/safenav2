import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  message: string;
  type: 'alert' | 'info' | 'warning' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  related_user_id: string | null;
  related_entity_id: string | null;
  related_entity_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    }
  });

  // Real-time subscription
  useEffect(() => {
    if (isSubscribed) return;

    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('New notification:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
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

export const useUnreadNotificationCount = () => {
  const { data: notifications } = useNotifications();
  return notifications?.filter(n => !n.is_read).length || 0;
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

// Create a notification manually (for SOS alerts, etc.)
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: {
      message: string;
      type: 'alert' | 'info' | 'warning' | 'success';
      priority: 'low' | 'medium' | 'high' | 'critical';
      related_user_id?: string | null;
      related_entity_id?: string | null;
      related_entity_type?: string | null;
      metadata?: Record<string, unknown> | null;
    }) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          related_user_id: notification.related_user_id || null,
          related_entity_id: notification.related_entity_id || null,
          related_entity_type: notification.related_entity_type || null,
          metadata: notification.metadata ? JSON.parse(JSON.stringify(notification.metadata)) : null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};
