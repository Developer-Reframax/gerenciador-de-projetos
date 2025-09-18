import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase-client';
import type {
  KanbanTask,
  KanbanProject,
  KanbanColumn,
  KanbanViewType,
  KanbanData,
  KanbanProjectData,
  KanbanAssigneeData,
  KanbanProjectStatusData
} from '@/types/kanban';

type RealtimeNotification = {
  type: string;
  message: string;
  item_id: string;
  timestamp: Date;
};

interface UseKanbanRealTimeProps {
  viewType: KanbanViewType;
  data: KanbanData | null;
  onDataUpdate: (newData: KanbanData) => void;
  onNotification?: (notification: RealtimeNotification) => void;
  enabled?: boolean;
}

interface UseKanbanRealTimeReturn {
  isConnected: boolean;
  lastUpdate: Date | null;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * Hook personalizado para atualizações em tempo real do Kanban
 * Monitora mudanças nas tarefas e projetos via Supabase Realtime
 */
export function useKanbanRealTime({
  viewType,
  data,
  onDataUpdate,
  onNotification,
  enabled = true
}: UseKanbanRealTimeProps): UseKanbanRealTimeReturn {
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isConnectedRef = useRef(false);
  const lastUpdateRef = useRef<Date | null>(null);

  // Função para processar atualizações de tarefas
  const handleTaskUpdate = useCallback((payload: {new?: KanbanTask; old?: KanbanTask; eventType: string}) => {
    if (!data || viewType === 'status') return; // Status view não monitora tarefas

    const { eventType, new: newRecord, old: oldRecord } = payload;
    const task = newRecord || oldRecord;

    if (!task) return;

    // Todas as tarefas são relevantes na visualização simplificada

    let updatedData = { ...data };
    let notificationMessage = '';

    switch (eventType) {
      case 'INSERT':
        updatedData = addTaskToData(updatedData, task, viewType);
        notificationMessage = `Nova tarefa criada: ${task.title}`;
        break;

      case 'UPDATE':
        if (oldRecord) {
          updatedData = updateTaskInData(updatedData, task, oldRecord, viewType);
        }
        notificationMessage = `Tarefa atualizada: ${task.title}`;
        break;

      case 'DELETE':
        if (oldRecord) {
          updatedData = removeTaskFromData(updatedData, oldRecord);
          notificationMessage = `Tarefa removida: ${oldRecord.title}`;
        }
        break;
    }

    onDataUpdate(updatedData);
    lastUpdateRef.current = new Date();

    // Enviar notificação se habilitado
    if (onNotification) {
      onNotification({
        type: 'task_update',
        message: notificationMessage,
        item_id: task.id,
        timestamp: new Date()
      });
    }
  }, [data, viewType, onDataUpdate, onNotification]);

  // Função para processar atualizações de projetos
  const handleProjectUpdate = useCallback((payload: {new?: KanbanProject; old?: KanbanProject; eventType: string}) => {
    if (!data) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;
    const project = newRecord || oldRecord;

    if (!project) return;

    // Todos os projetos são relevantes na visualização simplificada

    let updatedData = { ...data };
    let notificationMessage = '';

    switch (eventType) {
      case 'INSERT':
        if (viewType === 'status') {
          updatedData = addProjectToData(updatedData, project);
        }
        notificationMessage = `Novo projeto criado: ${project.name}`;
        break;

      case 'UPDATE':
        if (viewType === 'status') {
          updatedData = updateProjectInData(updatedData, project);
        } else {
          // Para outras visualizações, pode afetar as tarefas do projeto
          updatedData = updateProjectMetadataInTasks(updatedData, project);
        }
        notificationMessage = `Projeto atualizado: ${project.name}`;
        break;

      case 'DELETE':
        if (oldRecord) {
          if (viewType === 'status') {
            updatedData = removeProjectFromData(updatedData, oldRecord);
          } else {
            // Remover todas as tarefas do projeto
            updatedData = removeTasksByProject(updatedData, oldRecord.id);
          }
          notificationMessage = `Projeto removido: ${oldRecord.name}`;
        }
        break;
    }

    onDataUpdate(updatedData);
    lastUpdateRef.current = new Date();

    // Enviar notificação se habilitado
    if (onNotification) {
      onNotification({
        type: 'project_update',
        message: notificationMessage,
        item_id: project.id,
        timestamp: new Date()
      });
    }
  }, [data, viewType, onDataUpdate, onNotification]);

  // Função para conectar ao Supabase Realtime
  const connect = useCallback(() => {
    if (!enabled || subscriptionRef.current) return;

    try {
      // Criar canal para atualizações
      const channel = supabase.channel('kanban-updates');

      // Inscrever-se em mudanças de tarefas
      (channel as unknown as { on: (event: string, config: object, callback: (payload: { eventType?: string; new?: KanbanTask; old?: KanbanTask }) => void) => void }).on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload: { eventType?: string; new?: KanbanTask; old?: KanbanTask }) => {
          handleTaskUpdate({
            eventType: payload.eventType || 'UPDATE',
            new: payload.new,
            old: payload.old
          });
        }
      );

      // Inscrever-se em mudanças de projetos
      (channel as unknown as { on: (event: string, config: object, callback: (payload: { eventType?: string; new?: KanbanProject; old?: KanbanProject }) => void) => void }).on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload: { eventType?: string; new?: KanbanProject; old?: KanbanProject }) => {
          handleProjectUpdate({
            eventType: payload.eventType || 'UPDATE',
            new: payload.new,
            old: payload.old
          });
        }
      );

      // Configurar callbacks de status
      channel.on('presence', { event: 'sync' }, () => {
        console.log('Kanban realtime: Presença sincronizada');
      });

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Kanban realtime: Usuário conectado', key, newPresences);
      });

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Kanban realtime: Usuário desconectado', key, leftPresences);
      });

      // Subscrever ao canal
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Kanban realtime: Conectado com sucesso');
          isConnectedRef.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Kanban realtime: Erro na conexão');
          isConnectedRef.current = false;
        } else if (status === 'TIMED_OUT') {
          console.warn('Kanban realtime: Timeout na conexão');
          isConnectedRef.current = false;
        } else if (status === 'CLOSED') {
          console.log('Kanban realtime: Conexão fechada');
          isConnectedRef.current = false;
        }
      });

      subscriptionRef.current = channel;
    } catch (error) {
      console.error('Erro ao conectar Kanban realtime:', error);
      isConnectedRef.current = false;
    }
  }, [enabled, handleTaskUpdate, handleProjectUpdate]);

  // Função para desconectar
  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
      isConnectedRef.current = false;
      console.log('Kanban realtime: Desconectado');
    }
  }, []);

  // Função para reconectar
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000); // Aguardar 1 segundo antes de reconectar
  }, [disconnect, connect]);

  // Efeito para conectar/desconectar baseado no estado enabled
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Efeito para reconectar quando filtros mudarem
  useEffect(() => {
    if (enabled && subscriptionRef.current) {
      reconnect();
    }
  }, [enabled, reconnect]);

  return {
    isConnected: isConnectedRef.current,
    lastUpdate: lastUpdateRef.current,
    disconnect,
    reconnect
  };
}

// Funções auxiliares para manipulação de dados

function addTaskToData(data: KanbanData, task: KanbanTask, viewType: KanbanViewType): KanbanData {
  const newData = { ...data };
  
  // Determinar em qual coluna adicionar baseado no tipo de visualização
  let targetColumnId = '';
  
  switch (viewType) {
    case 'project':
      targetColumnId = task.status;
      break;
    case 'assignee':
      targetColumnId = task.assigned_to || 'unassigned';
      break;
  }
  
  // Determinar qual tipo de colunas usar
  let columns: KanbanColumn[] = [];
  if ('columns' in data) {
    columns = data.columns;
  } else if ('assignee_columns' in data) {
    columns = data.assignee_columns;
  }
  
  const updatedColumns = columns.map(column => {
    if (column.id === targetColumnId) {
      return {
        ...column,
        tasks: [...(column.tasks || []), task]
      };
    }
    return column;
  });
  
  // Atualizar as colunas corretas
  if ('columns' in data) {
    (newData as KanbanProjectData).columns = updatedColumns;
  } else if ('assignee_columns' in data) {
    (newData as KanbanAssigneeData).assignee_columns = updatedColumns;
  }
  
  return newData;
}

function updateTaskInData(data: KanbanData, newTask: KanbanTask, oldTask: KanbanTask, viewType: KanbanViewType): KanbanData {
  const newData = { ...data };
  
  // Determinar qual tipo de colunas usar
  let columns: KanbanColumn[] = [];
  if ('columns' in data) {
    columns = data.columns;
  } else if ('assignee_columns' in data) {
    columns = data.assignee_columns;
  }
  
  // Remover da posição antiga
  const updatedColumns = columns.map(column => ({
    ...column,
    tasks: (column.tasks || []).filter(task => task.id !== newTask.id)
  }));
  
  // Atualizar as colunas corretas
  if ('columns' in data) {
    (newData as KanbanProjectData).columns = updatedColumns;
  } else if ('assignee_columns' in data) {
    (newData as KanbanAssigneeData).assignee_columns = updatedColumns;
  }
  
  // Adicionar na nova posição
  return addTaskToData(newData, newTask, viewType);
}

function removeTaskFromData(data: KanbanData, task: KanbanTask): KanbanData {
  const newData = { ...data };
  
  // Determinar qual tipo de colunas usar
  let columns: KanbanColumn[] = [];
  if ('columns' in data) {
    columns = data.columns;
  } else if ('assignee_columns' in data) {
    columns = data.assignee_columns;
  }
  
  const updatedColumns = columns.map(column => ({
    ...column,
    tasks: (column.tasks || []).filter(t => t.id !== task.id)
  }));
  
  // Atualizar as colunas corretas
  if ('columns' in data) {
    (newData as KanbanProjectData).columns = updatedColumns;
  } else if ('assignee_columns' in data) {
    (newData as KanbanAssigneeData).assignee_columns = updatedColumns;
  }
  
  return newData;
}

function addProjectToData(data: KanbanData, project: KanbanProject): KanbanData {
  const newData = { ...data };
  
  // Determinar qual tipo de colunas usar
  let columns: KanbanColumn[] = [];
  if ('columns' in data) {
    columns = data.columns;
  } else if ('status_columns' in data) {
    columns = data.status_columns;
  }
  
  // Adicionar projeto na coluna baseada no status
  const updatedColumns = columns.map(column => {
    if (column.id === project.status) {
      return {
        ...column,
        projects: [...(column.projects || []), project]
      };
    }
    return column;
  });
  
  // Atualizar as colunas corretas
  if ('columns' in data) {
    (newData as KanbanProjectData).columns = updatedColumns;
  } else if ('status_columns' in data) {
    (newData as KanbanProjectStatusData).status_columns = updatedColumns;
  }
  
  return newData;
}

function updateProjectInData(data: KanbanData, newProject: KanbanProject): KanbanData {
  const newData = { ...data };
  
  // Determinar qual tipo de colunas usar
  let columns: KanbanColumn[] = [];
  if ('columns' in data) {
    columns = data.columns;
  } else if ('status_columns' in data) {
    columns = data.status_columns;
  }
  
  // Remover da posição antiga
  const updatedColumns = columns.map((column: KanbanColumn) => ({
    ...column,
    projects: (column.projects || []).filter((project: KanbanProject) => project.id !== newProject.id)
  }));
  
  // Atualizar as colunas corretas
  if ('columns' in data) {
    (newData as KanbanProjectData).columns = updatedColumns;
  } else if ('status_columns' in data) {
    (newData as KanbanProjectStatusData).status_columns = updatedColumns;
  }
  
  // Adicionar na nova posição
  return addProjectToData(newData, newProject);
}

function removeProjectFromData(data: KanbanData, project: KanbanProject): KanbanData {
  const newData = { ...data };
  
  // Determinar qual tipo de colunas usar
  let columns: KanbanColumn[] = [];
  if ('columns' in data) {
    columns = data.columns;
  } else if ('status_columns' in data) {
    columns = data.status_columns;
  }
  
  const updatedColumns = columns.map((column: KanbanColumn) => ({
    ...column,
    projects: (column.projects || []).filter((p: KanbanProject) => p.id !== project.id)
  }));
  
  // Atualizar as colunas corretas
  if ('columns' in data) {
    (newData as KanbanProjectData).columns = updatedColumns;
  } else if ('status_columns' in data) {
    (newData as KanbanProjectStatusData).status_columns = updatedColumns;
  }
  
  return newData;
}

function updateProjectMetadataInTasks(data: KanbanData, project: KanbanProject): KanbanData {
  const newData = { ...data };
  
  // Determinar qual tipo de colunas usar
  let columns: KanbanColumn[] = [];
  if ('columns' in data) {
    columns = data.columns;
  } else if ('assignee_columns' in data) {
    columns = data.assignee_columns;
  }
  
  const updatedColumns = columns.map((column: KanbanColumn) => ({
    ...column,
    tasks: (column.tasks || []).map((task: KanbanTask) => {
      if (task.project_id === project.id) {
        return {
          ...task,
          project_name: project.name
        };
      }
      return task;
    })
  }));
  
  // Atualizar as colunas corretas
  if ('columns' in data) {
    (newData as KanbanProjectData).columns = updatedColumns;
  } else if ('assignee_columns' in data) {
    (newData as KanbanAssigneeData).assignee_columns = updatedColumns;
  }
  
  return newData;
}

function removeTasksByProject(data: KanbanData, projectId: string): KanbanData {
  const newData = { ...data };
  
  // Determinar qual tipo de colunas usar
  let columns: KanbanColumn[] = [];
  if ('columns' in data) {
    columns = data.columns;
  } else if ('assignee_columns' in data) {
    columns = data.assignee_columns;
  }
  
  const updatedColumns = columns.map((column: KanbanColumn) => ({
    ...column,
    tasks: (column.tasks || []).filter((task: KanbanTask) => task.project_id !== projectId)
  }));
  
  // Atualizar as colunas corretas
  if ('columns' in data) {
    (newData as KanbanProjectData).columns = updatedColumns;
  } else if ('assignee_columns' in data) {
    (newData as KanbanAssigneeData).assignee_columns = updatedColumns;
  }
  
  return newData;
}
