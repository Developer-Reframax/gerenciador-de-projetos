'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { 
  Notification, 
  NotificationsResponse, 
  CreateNotificationRequest,
  NotificationRealtimePayload 
} from '@/types/notifications';

// Interface para o channel do Supabase com postgres_changes
interface SupabaseRealtimeChannel {
  on: (
    event: 'postgres_changes',
    config: {
      event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
      schema: string;
      table: string;
      filter?: string;
    },
    callback: (payload: NotificationRealtimePayload) => void
  ) => SupabaseRealtimeChannel;
  subscribe: (callback?: (status: string) => void) => void;
}
import { toast } from 'sonner';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchNotifications = useCallback(async (params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.offset) queryParams.set('offset', params.offset.toString());
      if (params?.unreadOnly) queryParams.set('unread_only', 'true');
      
      const response = await fetch(`/api/notifications?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar notificações');
      }
      
      const data: NotificationsResponse = await response.json();
      
      if (params?.offset && params.offset > 0) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      
      setUnreadCount(data.unread_count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification_id: notificationId }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao marcar notificação como lida');
      }
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status_viewer: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao marcar todas as notificações como lidas');
      }
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, status_viewer: true }))
      );
      
      setUnreadCount(0);
      toast.success('Todas as notificações foram marcadas como lidas');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  const createNotification = useCallback(async (notification: CreateNotificationRequest) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar notificação');
      }
      
      toast.success('Notificação criada com sucesso');
      
      // Recarregar notificações
      await fetchNotifications();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [fetchNotifications]);

  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Configurar subscription em tempo real
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const channel = supabase
          .channel('notifications-changes');

        (channel as unknown as SupabaseRealtimeChannel).on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: NotificationRealtimePayload) => {
              console.log('Realtime notification update:', payload);
              
              switch (payload.eventType) {
                case 'INSERT':
                  setNotifications(prev => [payload.new, ...prev]);
                  if (!payload.new.status_viewer) {
                    setUnreadCount(prev => prev + 1);
                    toast.info(payload.new.message, {
                      description: 'Nova notificação recebida',
                    });
                  }
                  break;
                  
                case 'UPDATE':
                  setNotifications(prev => 
                    prev.map(notification => 
                      notification.id === payload.new.id ? payload.new : notification
                    )
                  );
                  
                  // Atualizar contador se status mudou
                  if (payload.old.status_viewer !== payload.new.status_viewer) {
                    if (payload.new.status_viewer) {
                      setUnreadCount(prev => Math.max(0, prev - 1));
                    } else {
                      setUnreadCount(prev => prev + 1);
                    }
                  }
                  break;
                  
                case 'DELETE':
                  setNotifications(prev => 
                    prev.filter(notification => notification.id !== payload.old.id)
                  );
                  if (!payload.old.status_viewer) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                  }
                  break;
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error('Erro ao configurar subscription em tempo real:', err);
      }
    };

    setupRealtimeSubscription();
  }, [supabase]);

  // Carregar notificações iniciais
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    refreshNotifications,
  };
}