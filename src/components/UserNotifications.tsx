import { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, AlertTriangle, Info, Loader2, BellOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface UserNotification {
  id: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  related_entity_type: string | null;
  related_user_id: string | null;
  metadata: any;
}

const STORAGE_KEY = 'safenav-user-notifications-enabled';

const UserNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('related_user_id', user.id)
      .in('related_entity_type', ['verification_result', 'report_result'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setNotifications(data as UserNotification[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!enabled) return;
    fetchNotifications();

    if (!user) return;
    const channel = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new as UserNotification;
          if (n.related_user_id === user.id && 
              ['verification_result', 'report_result'].includes(n.related_entity_type || '')) {
            setNotifications(prev => [n, ...prev].slice(0, 10));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, enabled]);

  const getIcon = (type: string, entityType: string | null) => {
    if (entityType === 'verification_result') {
      return type === 'success' 
        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
        : <XCircle className="w-4 h-4 text-destructive" />;
    }
    if (entityType === 'report_result') {
      return type === 'success'
        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
        : <AlertTriangle className="w-4 h-4 text-destructive" />;
    }
    return <Info className="w-4 h-4 text-primary" />;
  };

  // Always show the toggle card
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Notifications
            {enabled && notifications.filter(n => !n.is_read).length > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                {notifications.filter(n => !n.is_read).length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleEnabled}
            className="h-7 px-2 text-xs"
          >
            {enabled ? <Bell className="w-3 h-3 mr-1" /> : <BellOff className="w-3 h-3 mr-1" />}
            {enabled ? 'On' : 'Off'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {!enabled ? (
          <p className="text-sm text-muted-foreground text-center py-3">Notifications are turned off</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                n.is_read ? 'bg-muted/30 border-border' : 'bg-primary/5 border-primary/20'
              }`}
            >
              <div className="mt-0.5">{getIcon(n.type, n.related_entity_type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default UserNotifications;