import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUnverifiedUsers = () => {
  return useQuery({
    queryKey: ["profiles", "unverified"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_verified", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useVerifyUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update({
          is_verified: true,
          verification_status: "verified",
          admin_notes: "Verified by admin through Manage Users",
        } as never)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      const { error: notificationError } = await supabase.from("notifications").insert([
        {
          message: "Your account has been verified by the admin.",
          type: "success",
          priority: "medium",
          related_user_id: userId,
          related_entity_type: "verification_result",
          metadata: {
            source: "admin_manage_users",
          },
        },
      ]);

      if (notificationError) {
        console.error("Failed to create verification notification:", notificationError);
      }

      return updatedProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "unverified"] });
      queryClient.invalidateQueries({ queryKey: ["admin_stats"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    },
  });
};
