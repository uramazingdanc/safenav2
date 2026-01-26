import { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Shield,
  MapPin,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  useNotifications, 
  useUnreadNotificationCount, 
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  Notification
} from '@/hooks/useNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const NotificationCenter = () => {
  const { t } = useLanguage();
  const { data: notifications, isLoading } = useNotifications();
  const unreadCount = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'critical' || priority === 'high') {
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    }
    switch (type) {
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-ocean" />;
    }
  };

  const getNotificationBgColor = (notification: Notification) => {
    if (!notification.is_read) {
      if (notification.priority === 'critical' || notification.priority === 'high') {
        return 'bg-destructive/10 border-destructive/30';
      }
      return 'bg-ocean/10 border-ocean/30';
    }
    return 'bg-slate-800/50 border-slate-700';
  };

  const getEntityIcon = (entityType: string | null) => {
    switch (entityType) {
      case 'hazard_report':
        return <MapPin className="w-3 h-3" />;
      case 'verification':
        return <Shield className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white/70 hover:text-white hover:bg-command-muted"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold border-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-slate-900 border-slate-700 shadow-xl"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-ocean" />
            <h3 className="font-semibold text-white">{t.notifications}</h3>
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-xs">
                {unreadCount} {t.unread}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-ocean hover:text-ocean/80 hover:bg-slate-800"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Check className="w-3 h-3 mr-1" />
              )}
              {t.markAllRead}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-ocean" />
            </div>
          ) : !notifications?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">{t.noNotifications}</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-700/50',
                    getNotificationBgColor(notification)
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm',
                        notification.is_read ? 'text-slate-400' : 'text-white font-medium'
                      )}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                        {getEntityIcon(notification.related_entity_type)}
                        <span>
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {notification.priority === 'critical' && (
                          <Badge className="bg-destructive/20 text-destructive text-[10px] px-1 py-0">
                            {t.critical}
                          </Badge>
                        )}
                        {notification.priority === 'high' && (
                          <Badge className="bg-amber-500/20 text-amber-400 text-[10px] px-1 py-0">
                            {t.highPriority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-ocean flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
