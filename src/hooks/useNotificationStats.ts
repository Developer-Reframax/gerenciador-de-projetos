'use client';

import { useState, useEffect, useCallback } from 'react';
import { NotificationStats } from '@/types/notifications';
import { toast } from 'sonner';

export function useNotificationStats(periodDays: number = 30) {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/notifications/stats?period_days=${periodDays}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas de notificações');
      }
      
      const data: NotificationStats = await response.json();
      setStats(data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  const refreshStats = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}
