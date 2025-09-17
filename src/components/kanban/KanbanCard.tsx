import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {
  KanbanTask,
  KanbanProject,
  KanbanViewType
} from '../../../shared/types/kanban.js';
import {
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Flag,
  Users
} from 'lucide-react';

interface KanbanCardProps {
  item: KanbanTask | KanbanProject;
  viewType: KanbanViewType;
  onClick: () => void;
  isDragging?: boolean;
}

/**
 * Componente que representa um card individual no Kanban
 * Suporta drag & drop e diferentes tipos de visualização
 */
export function KanbanCard({ item, viewType, onClick, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({
    id: item.id,
    data: {
      type: viewType === 'status' ? 'project' : 'task',
      item
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  // Determinar se é tarefa ou projeto
  const isTask = 'project_id' in item;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-gray-200 p-4 cursor-pointer
        hover:shadow-md hover:border-gray-300 transition-all duration-200
        ${isBeingDragged ? 'shadow-lg rotate-2 scale-105 z-50' : ''}
        ${isBeingDragged ? 'opacity-50' : ''}
      `}
    >
      {/* Header do card */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
            {'title' in item ? item.title : 'name' in item ? item.name : ''}
          </h4>
          
          {item.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Indicadores de prioridade */}
        {item.priority && (
          <div className="flex-shrink-0 ml-2">
            <Flag className={`h-4 w-4 ${getPriorityColor(item.priority)}`} />
          </div>
        )}
      </div>

      {/* Conteúdo específico por tipo */}
      {isTask ? (
        <TaskCardContent task={item as KanbanTask} viewType={viewType} />
      ) : (
        <ProjectCardContent project={item as KanbanProject} />
      )}

      {/* Footer do card */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {/* Status */}
          <div className="flex items-center space-x-1">
            {getStatusIcon(item.status)}
            <span className="text-xs text-gray-600 capitalize">
              {item.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="flex items-center space-x-1">
          {/* ID do Item */}
          <div className="flex items-center space-x-1 text-gray-500">
            <span className="text-xs font-mono">#{item.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Conteúdo específico para cards de tarefa
 */
function TaskCardContent({ task, viewType }: { task: KanbanTask; viewType: KanbanViewType }) {
  return (
    <div className="space-y-2">
      {/* Projeto (se não estiver na visualização por projeto) */}
      {viewType !== 'project' && task.project_id && (
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span className="truncate">Projeto #{task.project_id}</span>
        </div>
      )}

      {/* Responsável (se não estiver na visualização por responsável) */}
      {viewType !== 'assignee' && task.assigned_to && (
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <User className="h-3 w-3" />
          <span className="truncate">Responsável: {task.assigned_to}</span>
        </div>
      )}

      {/* Datas */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        {task.due_date && (
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span className={`
              ${isOverdue(task.due_date) ? 'text-red-600 font-medium' : ''}
            `}>
              {formatDate(task.due_date)}
            </span>
          </div>
        )}
        
        {task.position !== undefined && (
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Pos: {task.position}</span>
          </div>
        )}
      </div>

      {/* ID da Tarefa */}
      <div className="text-xs text-gray-500 font-mono">
        ID: {task.id}
      </div>
    </div>
  );
}

/**
 * Conteúdo específico para cards de projeto
 */
function ProjectCardContent({ project }: { project: KanbanProject }) {
  return (
    <div className="space-y-2">
      {/* Equipe */}
      {project.team_name && (
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <Users className="h-3 w-3" />
          <span className="truncate">{project.team_name}</span>
        </div>
      )}

      {/* Estatísticas do projeto */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {project.total_tasks !== undefined && (
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium text-gray-900">{project.total_tasks}</div>
            <div className="text-gray-600">Tarefas</div>
          </div>
        )}
        
        {project.completed_tasks !== undefined && (
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium text-green-600">{project.completed_tasks}</div>
            <div className="text-gray-600">Concluídas</div>
          </div>
        )}
      </div>

      {/* ID do Projeto */}
      <div className="text-xs text-gray-500 font-mono">
        ID: {project.id}
      </div>

      {/* Status e Prioridade */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <span>Status: {project.status}</span>
        </div>
        
        {project.priority && (
          <div className="flex items-center space-x-1">
            <Flag className={`h-3 w-3 ${getPriorityColor(project.priority)}`} />
            <span>{project.priority}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Card compacto para listas densas
 */
interface CompactKanbanCardProps {
  item: KanbanTask | KanbanProject;
  onClick: () => void;
}

export function CompactKanbanCard({ item, onClick }: CompactKanbanCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded p-2 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {'title' in item ? item.title : 'name' in item ? item.name : ''}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {item.status.replace('_', ' ')}
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {item.priority && (
            <Flag className={`h-3 w-3 ${getPriorityColor(item.priority)}`} />
          )}
          {getStatusIcon(item.status, 'h-3 w-3')}
        </div>
      </div>
    </div>
  );
}

// Funções auxiliares

function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'alta':
      return 'text-red-500';
    case 'medium':
    case 'média':
      return 'text-yellow-500';
    case 'low':
    case 'baixa':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

function getStatusIcon(status: string, className: string = 'h-4 w-4') {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
    case 'concluído':
      return <CheckCircle2 className={`${className} text-green-500`} />;
    case 'in_progress':
    case 'active':
    case 'em_andamento':
      return <Clock className={`${className} text-blue-500`} />;
    case 'blocked':
    case 'on_hold':
    case 'bloqueado':
      return <AlertCircle className={`${className} text-red-500`} />;
    default:
      return <div className={`${className.replace('h-', 'w-').replace('w-', 'h-')} bg-gray-400 rounded-full`} />;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Hoje';
  } else if (diffDays === 1) {
    return 'Amanhã';
  } else if (diffDays === -1) {
    return 'Ontem';
  } else if (diffDays > 0 && diffDays <= 7) {
    return `Em ${diffDays} dias`;
  } else if (diffDays < 0 && diffDays >= -7) {
    return `${Math.abs(diffDays)} dias atrás`;
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  }
}

function isOverdue(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < now;
}

/**
 * Hook para animações do card
 */
export function useCardAnimations() {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  
  return {
    isHovered,
    setIsHovered,
    isPressed,
    setIsPressed,
    cardProps: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onMouseDown: () => setIsPressed(true),
      onMouseUp: () => setIsPressed(false),
    }
  };
}