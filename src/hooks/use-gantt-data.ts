'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types/project';

export interface GanttFilters {
  status: string[];
  priority: string[];
  team_id: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface GanttProject extends Omit<Project, 'owner' | 'team'> {
  owner: {
    id: string;
    full_name: string;
  };
  team: {
    id: string;
    name: string;
  } | null;
  total_tasks: number;
  completed_tasks: number;
}

export interface UseGanttDataReturn {
  projects: GanttProject[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGanttData(filters: GanttFilters): UseGanttDataReturn {
  const [projects, setProjects] = useState<GanttProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Construir query parameters
      const params = new URLSearchParams();
      
      if (filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }
      
      if (filters.priority.length > 0) {
        params.append('priority', filters.priority.join(','));
      }
      
      if (filters.team_id) {
        params.append('team_id', filters.team_id);
      }
      
      if (filters.start_date) {
        params.append('start_date', filters.start_date);
      }
      
      if (filters.end_date) {
        params.append('end_date', filters.end_date);
      }

      const response = await fetch(`/api/projects/gantt?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setProjects(data.projects || []);
    } catch (err) {
      console.error('Erro ao buscar projetos do Gantt:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const refetch = useCallback(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    refetch
  };
}

// Hook para atualizar datas de um projeto
export function useUpdateProjectDates() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDates = useCallback(async (
    projectId: string,
    dates: {
      start_date?: string | null;
      due_date?: string | null;
    }
  ) => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/dates`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao atualizar projeto');
      }

      return data.project;
    } catch (err) {
      console.error('Erro ao atualizar datas do projeto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    updateDates,
    isUpdating,
    error
  };
}
