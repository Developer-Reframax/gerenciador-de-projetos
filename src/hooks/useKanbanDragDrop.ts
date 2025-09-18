import { useState, useCallback } from 'react';
import {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type {
  KanbanColumn,
  KanbanTask,
  KanbanProject,
  KanbanViewType,
  MoveItemRequest,
  KanbanApiResponse,
  KanbanData,
  KanbanProjectData,
  KanbanAssigneeData,
  KanbanProjectStatusData
} from '@/types/kanban';

// Definir DragDropState localmente
type DragDropState = {
  activeId: string | null;
  activeItem: KanbanTask | KanbanProject | null;
  overId: string | null;
  isDragging: boolean;
};

interface UseKanbanDragDropProps {
  data: KanbanData | null;
  viewType: KanbanViewType;
  onDataUpdate: (newData: KanbanData) => void;
  onItemUpdate?: (itemId: string, updates: Partial<KanbanTask | KanbanProject>) => Promise<void>;
}

interface UseKanbanDragDropReturn {
  dragState: DragDropState;
  sensors: ReturnType<typeof useSensors>;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  moveItem: (request: MoveItemRequest) => Promise<boolean>;
  isValidDrop: (activeId: string, overId: string) => boolean;
}

/**
 * Hook personalizado para gerenciar drag and drop no Kanban
 * Suporta movimentação de tarefas e projetos entre colunas
 */
export function useKanbanDragDrop({
  data,
  viewType,
  onDataUpdate,
  onItemUpdate
}: UseKanbanDragDropProps): UseKanbanDragDropReturn {
  const [dragState, setDragState] = useState<DragDropState>({
    activeId: null,
    activeItem: null,
    overId: null,
    isDragging: false
  });

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Mínimo de 8px de movimento para iniciar drag
      },
    })
  );

  // Função para encontrar um item por ID
  const findItem = useCallback((itemId: string): { item: KanbanTask | KanbanProject; columnId: string } | null => {
    if (!data) return null;

    // Verificar se data tem columns (KanbanProjectData)
    if ('columns' in data) {
      for (const column of data.columns) {
        // Procurar em tasks
        const task = column.tasks?.find(task => task.id === itemId);
        if (task) {
          return { item: task, columnId: column.id };
        }
        
        // Procurar em projects
        const project = column.projects?.find(project => project.id === itemId);
        if (project) {
          return { item: project, columnId: column.id };
        }
      }
    }
    
    // Verificar se data tem assignee_columns (KanbanAssigneeData)
    if ('assignee_columns' in data) {
      for (const column of data.assignee_columns) {
        const task = column.tasks?.find(task => task.id === itemId);
        if (task) {
          return { item: task, columnId: column.id };
        }
      }
    }
    
    // Verificar se data tem status_columns (KanbanProjectStatusData)
    if ('status_columns' in data) {
      for (const column of data.status_columns) {
        const project = column.projects?.find(project => project.id === itemId);
        if (project) {
          return { item: project, columnId: column.id };
        }
      }
    }
    
    return null;
  }, [data]);

  // Função para validar se um drop é válido
  const isValidDrop = useCallback((activeId: string, overId: string): boolean => {
    if (!data || activeId === overId) return false;

    const activeItem = findItem(activeId);
    if (!activeItem) return false;

    // Verificar se overId é uma coluna válida baseado no tipo de data
    let targetColumn = null;
    
    if ('columns' in data) {
      targetColumn = data.columns.find(col => col.id === overId);
    } else if ('assignee_columns' in data) {
      targetColumn = data.assignee_columns.find(col => col.id === overId);
    } else if ('status_columns' in data) {
      targetColumn = data.status_columns.find(col => col.id === overId);
    }
    
    if (!targetColumn) return false;

    // Regras específicas por tipo de visualização
    const isTask = 'assigned_to' in activeItem.item;
    const isProject = !isTask;
    
    switch (viewType) {
      case 'project':
        // Na visualização por projeto, só tarefas podem ser movidas
        return isTask;
      
      case 'assignee':
        // Na visualização por responsável, só tarefas podem ser movidas
        return isTask;
      
      case 'status':
        // Na visualização por status, só projetos podem ser movidos
        return isProject;
      
      default:
        return false;
    }
  }, [data, viewType, findItem]);

  // Handler para início do drag
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeItem = findItem(active.id as string);

    if (activeItem) {
      setDragState({
        activeId: active.id as string,
        activeItem: activeItem.item,
        overId: null,
        isDragging: true
      });
    }
  }, [findItem]);

  // Handler para drag over (quando passa por cima de uma área de drop)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDragState((prev: DragDropState) => ({ ...prev, overId: null }));
      return;
    }

    const overId = over.id as string;
    
    // Verificar se é um drop válido
    if (isValidDrop(active.id as string, overId)) {
      setDragState((prev: DragDropState) => ({ ...prev, overId }));
    } else {
      setDragState((prev: DragDropState) => ({ ...prev, overId: null }));
    }
  }, [isValidDrop]);

  // Função para mover item via API
  const moveItem = useCallback(async (request: MoveItemRequest): Promise<boolean> => {
    try {
      const response = await fetch('/api/kanban/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result: KanbanApiResponse<{ success: boolean }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao mover item');
      }

      return true;
    } catch (error) {
      console.error('Erro ao mover item:', error);
      // TODO: Mostrar notificação de erro para o usuário
      return false;
    }
  }, []);

  // Função para atualizar dados localmente após movimentação
  const updateLocalData = useCallback((request: MoveItemRequest) => {
    if (!data) return;

    const newData = { ...data };
    
    // Encontrar item e removê-lo da coluna de origem
    let movedItem: KanbanTask | KanbanProject | null = null;
    
    // Determinar qual tipo de colunas usar
    let columns: KanbanColumn[] = [];
    if ('columns' in data) {
      columns = data.columns;
    } else if ('assignee_columns' in data) {
      columns = data.assignee_columns;
    } else if ('status_columns' in data) {
      columns = data.status_columns;
    }
    
    const updatedColumns = columns.map(column => {
      if (column.id === request.source_column) {
        // Procurar em tasks
        const taskIndex = (column.tasks || []).findIndex(task => task.id === request.item_id);
        if (taskIndex >= 0) {
          movedItem = column.tasks![taskIndex];
          return {
            ...column,
            tasks: column.tasks!.filter(task => task.id !== request.item_id)
          };
        }
        
        // Procurar em projects
        const projectIndex = (column.projects || []).findIndex(project => project.id === request.item_id);
        if (projectIndex >= 0) {
          movedItem = column.projects![projectIndex];
          return {
            ...column,
            projects: column.projects!.filter(project => project.id !== request.item_id)
          };
        }
      }
      return column;
    });

    // Adicionar item na coluna de destino
    if (movedItem && typeof movedItem === 'object' && movedItem !== null) {
      // Atualizar propriedades do item baseado na movimentação
      const updatedItem = Object.assign({}, movedItem) as KanbanTask | KanbanProject;
      
      if (request.item_type === 'task') {
        const task = updatedItem as KanbanTask;
        if (viewType === 'project') {
          task.status = request.target_column as KanbanTask['status'];
        } else if (viewType === 'assignee') {
          task.assigned_to = request.target_column;
        }
      } else if (request.item_type === 'project') {
        const project = updatedItem as KanbanProject;
        if (viewType === 'status') {
          project.status = request.target_column as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
        }
      }

      const finalColumns = updatedColumns.map(column => {
        if (column.id === request.target_column) {
          const isTask = 'assigned_to' in updatedItem;
          
          if (isTask) {
            return {
              ...column,
              tasks: [...(column.tasks || []), updatedItem as KanbanTask]
            };
          } else {
            return {
              ...column,
              projects: [...(column.projects || []), updatedItem as KanbanProject]
            };
          }
        }
        return column;
      });
      
      // Atualizar as colunas corretas no newData
      if ('columns' in newData) {
        (newData as KanbanProjectData).columns = finalColumns;
      } else if ('assignee_columns' in newData) {
        (newData as KanbanAssigneeData).assignee_columns = finalColumns;
      } else if ('status_columns' in newData) {
        (newData as KanbanProjectStatusData).status_columns = finalColumns;
      }

      // Notificar sobre a atualização do item
      if (onItemUpdate) {
        onItemUpdate(request.item_id, updatedItem);
      }
    } else {
      // Se não encontrou o item, apenas atualizar as colunas
      if ('columns' in newData) {
        (newData as KanbanProjectData).columns = updatedColumns;
      } else if ('assignee_columns' in newData) {
        (newData as KanbanAssigneeData).assignee_columns = updatedColumns;
      } else if ('status_columns' in newData) {
        (newData as KanbanProjectStatusData).status_columns = updatedColumns;
      }
    }

    // Atualizar dados
    onDataUpdate(newData);
  }, [data, viewType, onDataUpdate, onItemUpdate]);

  // Handler para fim do drag
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setDragState({
      activeId: null,
      activeItem: null,
      overId: null,
      isDragging: false
    });

    if (!over || !data) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Verificar se é um movimento válido
    if (!isValidDrop(activeId, overId)) return;

    const activeItem = findItem(activeId);
    if (!activeItem) return;

    const sourceColumnId = activeItem.columnId;
    const targetColumnId = overId;

    // Se não mudou de coluna, não fazer nada
    if (sourceColumnId === targetColumnId) return;

    // Calcular nova posição (no final da coluna de destino)
    let targetColumn = null;
    if ('columns' in data) {
      targetColumn = data.columns.find(col => col.id === targetColumnId);
    } else if ('assignee_columns' in data) {
      targetColumn = data.assignee_columns.find(col => col.id === targetColumnId);
    } else if ('status_columns' in data) {
      targetColumn = data.status_columns.find(col => col.id === targetColumnId);
    }
    
    const targetItems = [...(targetColumn?.tasks || []), ...(targetColumn?.projects || [])];
    const newPosition = targetItems.length;
    
    const isTask = 'assigned_to' in activeItem.item;

    // Criar request de movimentação
    const moveRequest: MoveItemRequest = {
      item_id: activeId,
      item_type: isTask ? 'task' : 'project',
      source_column: sourceColumnId,
      target_column: targetColumnId,
      new_position: newPosition,
      view_type: viewType
    };

    // Executar movimentação
    const success = await moveItem(moveRequest);
    
    if (success) {
      // Atualizar dados localmente (optimistic update)
      updateLocalData(moveRequest);
    }
  }, [data, isValidDrop, findItem, viewType, moveItem, updateLocalData]);



  return {
    dragState,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    moveItem,
    isValidDrop
  };
}

/**
 * Hook para gerenciar reordenação dentro da mesma coluna
 */
export function useColumnReorder() {
  const reorderItems = useCallback((items: (KanbanTask | KanbanProject)[], activeIndex: number, overIndex: number) => {
    return arrayMove(items, activeIndex, overIndex);
  }, []);

  return { reorderItems };
}

// Implementação simples do arrayMove
function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const item = newArray.splice(from, 1)[0];
  newArray.splice(to, 0, item);
  return newArray;
}
