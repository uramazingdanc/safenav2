import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  message: string;
  type: "alert" | "info" | "warning" | "success";
  priority: "low" | "medium" | "high" | "critical";
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
  const [user, setUser] = useState<any>(null);

  // 🔹 Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      // 🔹 Check if admin (based on profiles table)
      const { data: userRole } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();

      const isAdmin = userRole?.role === "admin" || userRole?.role === "moderator";

      let queryBuilder = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);

      if (isAdmin) {
        // ✅ ADMIN: only system-relevant incoming requests
        queryBuilder = queryBuilder.in("related_entity_type", ["hazard_report", "verification"]);
      } else {
        // ✅ USER: only their own notifications
        queryBuilder = queryBuilder
          .eq("related_user_id", user.id)
          .in("related_entity_type", [
            "verification_result",
            "report_result",
            "admin_hazard_added",
            "evac_center_added",
            "evac_center_full",
          ]);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data as Notification[];
    },
  });

  // 🔹 Real-time subscription (filtered per user role)
  useEffect(() => {
    if (!user || isSubscribed) return;

    const channel = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const n = payload.new as Notification;

          // Only refresh if relevant
          if (
            n.related_user_id === user.id || // user-specific
            ["hazard_report", "verification"].includes(n.related_entity_type || "") // admin
          ) {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsSubscribed(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [queryClient, isSubscribed, user]);

  return query;
};

export const useUnreadNotificationCount = () => {
  const { data: notifications } = useNotifications();
  return notifications?.filter((n) => !n.is_read).length || 0;
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// 🔹 Create notification manually
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: {
      message: string;
      type: "alert" | "info" | "warning" | "success";
      priority: "low" | "medium" | "high" | "critical";
      related_user_id?: string | null;
      related_entity_id?: string | null;
      related_entity_type?: string | null;
      metadata?: Record<string, unknown> | null;
    }) => {
      const { data, error } = await supabase
        .from("notifications")
        .insert([
          {
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            related_user_id: notification.related_user_id || null,
            related_entity_id: notification.related_entity_id || null,
            related_entity_type: notification.related_entity_type || null,
            metadata: notification.metadata ? JSON.parse(JSON.stringify(notification.metadata)) : null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
