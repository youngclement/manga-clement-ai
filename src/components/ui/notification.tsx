'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore } from '@/lib/stores/ui.store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export function NotificationContainer() {
  const { notifications, removeNotification } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onRemove
}: {
  notification: any;
  onRemove: () => void;
}) {
  const { id, type, title, message, action, duration } = notification;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onRemove, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onRemove]);

  return (
    <div className={cn(
      'relative p-4 rounded-lg shadow-lg border animate-in slide-in-from-right',
      'bg-background/95 backdrop-blur-sm',
      {
        'border-green-200 bg-green-50/10': type === 'success',
        'border-red-200 bg-red-50/10': type === 'error',
        'border-yellow-200 bg-yellow-50/10': type === 'warning',
        'border-blue-200 bg-blue-50/10': type === 'info',
      }
    )}>
      <div className="flex items-start space-x-3">
        <NotificationIcon type={type} />

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{title}</h4>
          {message && (
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          )}

          {action && (
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="mt-2 h-8"
            >
              {action.label}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 hover:bg-background/80"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-primary/30 rounded-b-lg animate-shrink"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}
