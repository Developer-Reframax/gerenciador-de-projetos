'use client';

import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBadgeProps } from '@/types/notifications';

export function NotificationBadge({ 
  count = 0, 
  onClick, 
  className 
}: NotificationBadgeProps) {
  const safeCount = count ?? 0;
  const hasNotifications = safeCount > 0;
  const displayCount = safeCount > 99 ? '99+' : safeCount.toString();

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-lg transition-all duration-200',
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        hasNotifications && 'text-blue-600',
        !hasNotifications && 'text-gray-500 hover:text-gray-700',
        className
      )}
      aria-label={`Notificações${hasNotifications ? ` (${safeCount} não lidas)` : ''}`}
    >
      <Bell className="w-5 h-5" />
      
      {hasNotifications && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-red-500 rounded-full border-2 border-white">
          {displayCount}
        </span>
      )}
    </button>
  );
}
