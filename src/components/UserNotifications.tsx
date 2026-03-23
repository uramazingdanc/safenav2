import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCircle, XCircle, AlertTriangle, Info, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";

interface UserNotification {
  id: string;
  message: string;
  type: "alert" | "info" | "warning" | "success";
  priority: "low" | "medium" | "high" | "critical";
  is_read: boolean;
  created_at: string;
  related_entity_type: string | null;
  related_user_id: string | null;
  metadata: Record<string, unknown> | null;
}

const ALLOWED_USER_NOTIFICATION_TYPES = [
  "verification_result",
  "report_result",
  "admin_hazard_added",
  "evac_center_added",
  "evac_center_full",
];

const UserNotifications = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("related_user_id", user.id)
      .in("related_entity_type", ALLOWED_USER_NOTIFICATION_TYPES)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    } else {
      setNotifications((data || []) as UserNotification[]);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const n = payload.new as UserNotification;

        if (n.related_user_id === user.id && ALLOWED_USER_NOTIFICATION_TYPES.includes(n.related_entity_type || "")) {
          setNotifications((prev) => [n, ...prev].slice(0, 20));
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, (payload) => {
        const updated = payload.new as UserNotification;

        if (
          updated.related_user_id === user.id &&
          ALLOWED_USER_NOTIFICATION_TYPES.includes(updated.related_entity_type || "")
        ) {
          setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications" }, (payload) => {
        const deletedId = payload.old.id;
        setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const getIcon = (type: UserNotification["type"], entityType: string | null) => {
    if (entityType === "verification_result") {
      return type === "success" ? (
        <CheckCircle className="h-4 w-4 text-emerald-500" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive" />
      );
    }

    if (entityType === "report_result") {
      return type === "success" ? (
        <CheckCircle className="h-4 w-4 text-emerald-500" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-destructive" />
      );
    }

    if (entityType === "admin_hazard_added") {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }

    if (entityType === "evac_center_added") {
      return <Info className="h-4 w-4 text-blue-500" />;
    }

    if (entityType === "evac_center_full") {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }

    return <Info className="h-4 w-4 text-primary" />;
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            {t.notifications}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-1.5 py-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>

          <Button variant="ghost" size="icon" onClick={() => setIsOpen((prev) => !prev)} className="h-8 w-8">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                n.is_read ? "border-border bg-muted/30" : "border-primary/20 bg-primary/5"
              }`}
            >
              <div className="mt-0.5">{getIcon(n.type, n.related_entity_type)}</div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export default UserNotifications;
