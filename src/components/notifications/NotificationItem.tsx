'use client';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Check, Clock, AlertCircle, Info, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationItemProps, NotificationType, NotificationPriority } from '@/types/notifications';

const typeIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  general: Info,
  welcome: Star,
  project_assignment: Bell,
  task_assignment: Bell,
  deadline_reminder: Clock,
  status_update: Info,
  comment: Info,
  mention: Bell,
  system: AlertCircle,
  strategic: Star,
};

const priorityColors: Record<NotificationPriority, string> = {
  low: 'text-gray-500',
  normal: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

const priorityBgColors: Record<NotificationPriority, string> = {
  low: 'bg-gray-50 border-gray-200',
  normal: 'bg-blue-50 border-blue-200',
  high: 'bg-orange-50 border-orange-200',
  urgent: 'bg-red-50 border-red-200',
};

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  showActions = true 
}: NotificationItemProps) {
  const IconComponent = typeIcons[notification.type] || Info;
  const priorityColor = priorityColors[notification.priority];
  const priorityBg = priorityBgColors[notification.priority];
  
  const handleMarkAsRead = () => {
    if (!notification.status_viewer) {
      onMarkAsRead(notification.id);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div
      className={cn(
        'p-4 border-l-4 transition-all duration-200 hover:shadow-sm cursor-pointer',
        notification.status_viewer 
          ? 'bg-white border-l-gray-300 opacity-75' 
          : `${priorityBg} border-l-current`,
        !notification.status_viewer && priorityColor
      )}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex-shrink-0 p-2 rounded-full',
          notification.status_viewer 
            ? 'bg-gray-100 text-gray-500' 
            : 'bg-white text-current'
        )}>
          <IconComponent className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm leading-relaxed',
              notification.status_viewer 
                ? 'text-gray-600' 
                : 'text-gray-900 font-medium'
            )}>
              {notification.message}
            </p>
            
            {!notification.status_viewer && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
            )}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="capitalize">
                {notification.type.replace('_', ' ')}
              </span>
              <span className="capitalize">
                {notification.priority}
              </span>
              <span>
                {formatDate(notification.created_at)}
              </span>
            </div>
            
            {showActions && !notification.status_viewer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              >
                <Check className="w-3 h-3" />
                Marcar como lida
              </button>
            )}
          </div>
          
          {notification.status_email && (
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <Check className="w-3 h-3" />
              Enviada por email
            </div>
          )}
        </div>
      </div>
    </div>
  );
}