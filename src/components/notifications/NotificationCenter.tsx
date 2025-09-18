'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Settings, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationCenterProps } from '@/types/notifications';
import { NotificationList } from './NotificationList';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';

export function NotificationCenter({ 
  isOpen, 
  onClose, 
  className 
}: NotificationCenterProps) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Carregar mais notificações quando chegar ao final
  const loadMoreNotifications = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      await fetchNotifications({
        limit: 20,
        offset: notifications.length,
      });
      
      // Se retornou menos de 20, não há mais notificações
      if (notifications.length % 20 !== 0) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Erro ao carregar mais notificações:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Detectar scroll para carregar mais
  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    
    const { scrollTop, scrollHeight, clientHeight } = element;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    if (isNearBottom && !loadingMore && hasMore) {
      loadMoreNotifications();
    }
  };

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={cn(
        'fixed right-4 top-16 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border z-50',
        'max-h-[calc(100vh-5rem)] flex flex-col',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="font-semibold text-gray-900">Notificações</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">
                {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
        >
          {error ? (
            <div className="p-4 text-center text-red-600">
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications()}
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <NotificationList
              notifications={notifications}
              loading={loading}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              showActions={true}
              emptyMessage="Você não tem notificações"
            />
          )}
          
          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex items-center justify-center py-4 border-t">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500 mr-2" />
              <span className="text-sm text-gray-500">Carregando mais...</span>
            </div>
          )}
          
          {/* No more notifications */}
          {!hasMore && notifications.length > 0 && (
            <div className="p-4 text-center border-t">
              <p className="text-xs text-gray-500">
                Todas as notificações foram carregadas
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}