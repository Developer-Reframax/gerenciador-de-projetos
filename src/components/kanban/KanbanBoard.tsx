import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import type {
  KanbanViewType,
  KanbanColumn as KanbanColumnType,
  KanbanTask,
  KanbanProject,
  KanbanData
} from '../../../shared/types/kanban';
import { Loader2, AlertCircle } from 'lucide-react';

interface KanbanBoardProps {
  data: KanbanData | null;
  viewType: KanbanViewType;
  onItemClick: (item: KanbanTask | KanbanProject) => void;
  loading?: boolean;
}

/**
 * Componente principal do board Kanban
 * Renderiza as colunas e gerencia o layout responsivo
 */
export function KanbanBoard({ data, viewType, onItemClick, loading = false }: KanbanBoardProps) {
  // Se não há dados, mostrar estado vazio
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum dado encontrado
            </h3>
            <p className="text-gray-600">
              Ajuste os filtros ou verifique se há {viewType === 'status' ? 'projetos' : 'tarefas'} disponíveis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se não há colunas, mostrar estado vazio
  const columns = getColumns(data);
  if (!columns || columns.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma coluna configurada
            </h3>
            <p className="text-gray-600">
              Configure as colunas do Kanban para começar a usar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header com informações do board */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {getViewTitle(viewType)}
            </h2>
            
            {/* Estatísticas */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>
                {getColumns(data).reduce((total, col) => total + (col.tasks?.length || 0) + (col.projects?.length || 0), 0)} itens
              </span>
              <span>•</span>
              <span>
                {getColumns(data).length} colunas
              </span>
              {'metadata' in data && data.metadata?.total_tasks && (
                <>
                  <span>•</span>
                  <span>
                    {data.metadata.total_tasks} tarefas totais
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Indicador de loading */}
          {loading && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Atualizando...</span>
            </div>
          )}
        </div>
      </div>

      {/* Board com colunas */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-x-auto overflow-y-auto">
          <div className="flex space-x-6 p-6 min-w-max min-h-full">
            {getColumns(data).map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                viewType={viewType}
                onItemClick={onItemClick}
              />
            ))}
            
            {/* Coluna placeholder para melhor UX */}
            <div className="w-80 flex-shrink-0">
              <div className="h-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-sm font-medium mb-1">
                    Arraste itens aqui
                  </div>
                  <div className="text-xs">
                    para reorganizar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer com informações adicionais */}
      {'metadata' in data && data.metadata && (
        <div className="flex-shrink-0 px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              {data.metadata.last_updated && (
                <span>
                  Última atualização: {new Date(data.metadata.last_updated).toLocaleString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {data.metadata.total_projects && (
                <span>{data.metadata.total_projects} projetos</span>
              )}
              {data.metadata.total_tasks && (
                <span>{data.metadata.total_tasks} tarefas</span>
              )}
              {data.metadata.completed_tasks && (
                <span>{data.metadata.completed_tasks} concluídas</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente para área de drop personalizada
 */
interface DroppableAreaProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function DroppableArea({ id, children, className = '' }: DroppableAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        ${className}
        ${isOver ? 'bg-blue-50 border-blue-200' : ''}
        transition-colors duration-200
      `}
    >
      {children}
    </div>
  );
}

// Funções auxiliares

function getColumns(data: KanbanData | null): KanbanColumnType[] {
  if (!data) {
    return [];
  }

  // Se data é um array (lista de projetos), criar colunas padrão com projetos filtrados por status
  if (Array.isArray(data)) {
    const defaultColumns = [
      { id: 'planning', title: 'Planejamento', color: '#f59e0b', order: 1 },
      { id: 'active', title: 'Em Andamento', color: '#3b82f6', order: 2 },
      { id: 'on_hold', title: 'Em Espera', color: '#ef4444', order: 3 },
      { id: 'completed', title: 'Concluído', color: '#10b981', order: 4 }
    ];

    return defaultColumns.map(col => ({
      ...col,
      tasks: [],
      projects: data.filter((project: KanbanProject) => project.status === col.id)
    }));
  }

  // Para outros tipos de dados, usar as colunas existentes ou retornar vazio
  if ('columns' in data) {
    return data.columns || [];
  }
  if ('assignee_columns' in data) {
    return data.assignee_columns || [];
  }
  if ('status_columns' in data) {
    return data.status_columns || [];
  }

  return [];
}

function getViewTitle(viewType: KanbanViewType): string {
  switch (viewType) {
    case 'project':
      return 'Visualização por Projeto';
    case 'assignee':
      return 'Visualização por Responsável';
    case 'status':
      return 'Visualização por Status do Projeto';
    default:
      return 'Kanban Board';
  }
}

/**
 * Hook personalizado para calcular estatísticas do board
 */
export function useBoardStats(data: KanbanData | null) {
  if (!data) {
    return {
      totalItems: 0,
      totalColumns: 0,
      completedItems: 0,
      inProgressItems: 0,
      completionRate: 0
    };
  }

  const columns = getColumns(data);
  const totalItems = columns.reduce((total, col) => total + (col.tasks?.length || 0) + (col.projects?.length || 0), 0);
  const totalColumns = columns.length;
  
  // Calcular itens concluídos baseado no tipo de visualização
  const completedItems = columns.reduce((total, col) => {
    if (col.id === 'completed' || col.id === 'done') {
      return total + (col.tasks?.length || 0) + (col.projects?.length || 0);
    }
    return total;
  }, 0);
  
  const inProgressItems = columns.reduce((total, col) => {
    if (col.id === 'in_progress' || col.id === 'active') {
      return total + (col.tasks?.length || 0) + (col.projects?.length || 0);
    }
    return total;
  }, 0);
  
  const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return {
    totalItems,
    totalColumns,
    completedItems,
    inProgressItems,
    completionRate: Math.round(completionRate)
  };
}