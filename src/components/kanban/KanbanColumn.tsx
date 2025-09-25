import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type {
  KanbanColumn as KanbanColumnType,
  KanbanViewType,
  KanbanTask,
  KanbanProject
} from '@/types/kanban';
import { Plus, MoreVertical } from 'lucide-react';

interface KanbanColumnProps {
  column: KanbanColumnType;
  viewType: KanbanViewType;
  onItemClick: (item: KanbanTask | KanbanProject) => void;
  onAddItem?: () => void;
}

/**
 * Componente que representa uma coluna do Kanban
 * Gerencia os itens dentro da coluna e o drag & drop
 */
export function KanbanColumn({ 
  column, 
  viewType, 
  onItemClick, 
  onAddItem 
}: KanbanColumnProps) {
  const {
    setNodeRef,
    isOver,
    active
  } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column
    }
  });

  // Determinar se está sendo arrastado sobre esta coluna
  const isDraggedOver = isOver && active;
  
  // IDs dos itens para o SortableContext
  const items = [...(column.tasks || []), ...(column.projects || [])];
  const itemIds = items.map(item => item.id);

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 min-h-96">
      {/* Header da coluna */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            {/* Indicador de cor da coluna */}
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: getDefaultColumnColor(column.id) }}
            />
            
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {column.title}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                <span>{items.length} itens</span>
              </div>
            </div>
          </div>

          {/* Ações da coluna */}
          <div className="flex items-center space-x-1">
            {onAddItem && (
              <button
                onClick={onAddItem}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                title="Adicionar item"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            
            <button
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
              title="Mais opções"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Área de drop da coluna */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-32 rounded-lg border-2 border-dashed transition-all duration-200
          ${isDraggedOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-600 bg-gray-50/30 dark:bg-gray-800/30'
          }
          ${items.length === 0 ? 'flex items-center justify-center' : ''}
        `}
      >
        {items.length === 0 ? (
          // Estado vazio
          <div className="text-center p-6">
            <div className="text-gray-400 text-sm">
              {isDraggedOver 
                ? 'Solte aqui para mover' 
                : `Nenhum${viewType === 'status' ? ' projeto' : 'a tarefa'} em ${column.title.toLowerCase()}`
              }
            </div>
          </div>
        ) : (
          // Lista de itens
          <div className="p-3 space-y-3">
            <SortableContext 
              items={itemIds} 
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  viewType={viewType}
                  onClick={() => onItemClick(item)}
                />
              ))}
            </SortableContext>
          </div>
        )}
      </div>

      {/* Footer da coluna com informações adicionais */}
      <div className="flex-shrink-0 mt-2">
        <div className="text-xs text-gray-500 text-center">
          Total: {items.length} itens
        </div>
      </div>
    </div>
  );
}

/**
 * Componente para coluna compacta (visualização reduzida)
 */
interface CompactKanbanColumnProps {
  column: KanbanColumnType;
  viewType: KanbanViewType;
  onItemClick: (item: KanbanTask | KanbanProject) => void;
}

export function CompactKanbanColumn({ 
  column, 
  viewType, 
  onItemClick 
}: CompactKanbanColumnProps) {
  const items = [...(column.tasks || []), ...(column.projects || [])];
  
  return (
    <div className="w-64 flex-shrink-0 h-full flex flex-col">
      {/* Header compacto */}
      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getDefaultColumnColor(column.id) }}
          />
          <span className="text-sm font-medium text-gray-900 truncate">
            {column.title}
          </span>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
          {items.length}
        </span>
      </div>

      {/* Lista compacta de itens */}
      <div className="bg-white dark:bg-gray-800 rounded-b-lg flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            Vazio
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.slice(0, 5).map((item) => (
              <div
                key={item.id}
                onClick={() => onItemClick(item)}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                  {'title' in item ? item.title : 'name' in item ? item.name : ''}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {viewType === 'status' ? 'Projeto' : 'Tarefa'}
                  </span>
                  {item.priority && (
                    <span className={`
                      text-xs px-2 py-1 rounded-full
                      ${getPriorityColor(item.priority)}
                    `}>
                      {item.priority}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {items.length > 5 && (
              <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
                +{items.length - 5} mais
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Funções auxiliares

function getDefaultColumnColor(columnId: string): string {
  const colors: Record<string, string> = {
    'backlog': '#6B7280',
    'todo': '#3B82F6',
    'in_progress': '#F59E0B',
    'review': '#8B5CF6',
    'done': '#10B981',
    'completed': '#10B981',
    'cancelled': '#EF4444',
    'planning': '#6366F1',
    'active': '#F59E0B',
    'on_hold': '#F97316',
    'archived': '#6B7280'
  };
  
  return colors[columnId] || '#6B7280';
}

function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'alta':
      return 'bg-red-100 text-red-800';
    case 'medium':
    case 'média':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
    case 'baixa':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Hook para gerenciar estado da coluna
 */
export function useColumnState() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);
  
  const isOverLimit = false;
  const utilizationRate = 0;
  
  return {
    isCollapsed,
    setIsCollapsed,
    showAddForm,
    setShowAddForm,
    isOverLimit,
    utilizationRate
  };
}
