import { useState, useEffect, useCallback } from 'react';
import type {
  KanbanViewType,
  KanbanColumn,
  KanbanTask,
  KanbanProject,
  KanbanApiResponse,
  KanbanData
} from '@/types/kanban';

interface UseKanbanDataProps {
  viewType: KanbanViewType;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseKanbanDataReturn {
  data: KanbanData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateItem: (itemId: string, updates: Partial<KanbanTask | KanbanProject>) => void;
}

/**
 * Hook personalizado para gerenciar dados do Kanban
 * Suporta as três visualizações: projeto, responsáveis e status de projeto
 */
export function useKanbanData({
  autoRefresh = false,
  refreshInterval = 30000
}: Omit<UseKanbanDataProps, 'viewType'>): UseKanbanDataReturn {
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar dados - visualização fixa por projetos
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // URL fixa para visualização por projetos
      const url = '/api/kanban/project/list';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result: KanbanApiResponse<KanbanData> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      setData(result.data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados do Kanban';
      setError(errorMessage);
      console.error('Erro no useKanbanData:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para atualizar um item localmente (otimistic update)
  const updateItem = useCallback((itemId: string, updates: Partial<KanbanTask | KanbanProject>) => {
    if (!data) return;

    setData(prevData => {
        if (!prevData) return null;

        const newData = { ...prevData };
        
        // Atualizar nas colunas baseado no tipo de dados
        let columns: KanbanColumn[] = [];
        if ('columns' in newData) {
          columns = newData.columns;
        } else if ('assignee_columns' in newData) {
          columns = newData.assignee_columns;
        } else if ('status_columns' in newData) {
          columns = newData.status_columns;
        }
        
        const updatedColumns = columns.map(column => {
          const tasks = (column.tasks || []).map(task => 
            task.id === itemId ? { ...task, ...updates } : task
          );
          const projects = (column.projects || []).map(project => 
            project.id === itemId ? { ...project, ...updates } : project
          );
          
          return {
            ...column,
            tasks,
            projects
          };
        });
        
        // Atualizar o tipo correto de dados
         if ('columns' in newData) {
           newData.columns = updatedColumns as KanbanColumn[];
         } else if ('assignee_columns' in newData) {
           newData.assignee_columns = updatedColumns as KanbanColumn[];
         } else if ('status_columns' in newData) {
           newData.status_columns = updatedColumns as KanbanColumn[];
         }

        return newData;
      });
  }, [data]);

  // Efeito para buscar dados iniciais e quando dependências mudarem
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Efeito para auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updateItem
  };
}

/**
 * Hook para buscar projetos disponíveis para filtros
 */
export function useAvailableProjects(teamId?: string) {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (teamId) params.append('team_id', teamId);

      const response = await fetch(`/api/kanban/project/available?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar projetos');
      }

      setProjects(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar projetos';
      setError(errorMessage);
      console.error('Erro no useAvailableProjects:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
}

/**
 * Hook para buscar equipes disponíveis para filtros
 */
export function useAvailableTeams() {
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/kanban/assignees/teams', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar equipes');
      }

      setTeams(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar equipes';
      setError(errorMessage);
      console.error('Erro no useAvailableTeams:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return { teams, loading, error, refetch: fetchTeams };
}
