'use client';

import { CheckCheck, Loader2, Bell } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { NotificationListProps } from '@/types/notifications';
import { Button } from '@/components/ui/button';

export function NotificationList({
  notifications,
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  showActions = true,
  emptyMessage = 'Nenhuma notificação encontrada'
}: NotificationListProps) {
  const unreadNotifications = notifications.filter(n => !n.status_viewer);
  const hasUnreadNotifications = unreadNotifications.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-sm text-gray-500">Carregando notificações...</span>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header com ações */}
      {showActions && hasUnreadNotifications && onMarkAllAsRead && (
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <span className="text-sm text-gray-600">
            {unreadNotifications.length} notificação{unreadNotifications.length !== 1 ? 'ões' : ''} não lida{unreadNotifications.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            Marcar todas como lidas
          </Button>
        </div>
      )}

      {/* Lista de notificações */}
      <div className="divide-y divide-gray-100">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            showActions={showActions}
          />
        ))}
      </div>

      {/* Footer com informações */}
      {notifications.length > 0 && (
        <div className="p-4 bg-gray-50 border-t text-center">
          <p className="text-xs text-gray-500">
            {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''} • 
            {unreadNotifications.length} não lida{unreadNotifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
