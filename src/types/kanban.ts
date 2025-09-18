// Tipos para o sistema Kanban

// Tipos base para visualizações
export type KanbanViewType = 'project' | 'assignee' | 'status';

export interface KanbanView {
  id: string;
  user_id: string;
  view_type: KanbanViewType;
  view_name: string;
  filters: KanbanFilters;
  column_config: ColumnConfig[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para tarefas no Kanban
export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled' | 'review' | 'blocked';
  assigned_to?: string;
  assigned_avatar?: string;
  due_date?: string;
  position: number;
  project_id?: string;
  project_name?: string;
}

// Tipos para projetos no Kanban
export interface KanbanProject {
  id: string;
  name: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  team_name?: string;
  start_date?: string;
  end_date?: string;
  progress: number;
  total_tasks: number;
  completed_tasks: number;
}

// Tipos para colunas do Kanban
export interface KanbanColumn {
  id: string;
  title: string;
  tasks?: KanbanTask[];
  projects?: KanbanProject[];
  avatar?: string; // Para colunas de responsáveis
}

// Tipos para metadados do Kanban
export interface KanbanMetadata {
  total_tasks?: number;
  total_projects?: number;
  completed_tasks?: number;
  filters_applied?: boolean;
  last_updated?: string;
}

// Tipos para dados das diferentes visualizações
export interface KanbanProjectData {
  project_info: {
    id: string;
    name: string;
    description?: string;
    team_id: string;
  };
  columns: KanbanColumn[];
  metadata?: KanbanMetadata;
}

export interface KanbanAssigneeData {
  team_info: {
    id: string;
    name: string;
    description?: string;
  };
  assignee_columns: KanbanColumn[];
  metadata?: KanbanMetadata;
}

export interface KanbanProjectStatusData {
  status_columns: KanbanColumn[];
  metadata?: KanbanMetadata;
}

// Tipo para lista de projetos (quando não há project_id específico)
export type KanbanProjectListData = KanbanProject[];

// Union type para todos os tipos de dados do Kanban
export type KanbanData = KanbanProjectData | KanbanAssigneeData | KanbanProjectStatusData | KanbanProjectListData;

// Tipos para filtros
export interface KanbanFilters {
  search?: string;
  project_ids?: string[];
  assignee_ids?: string[];
  team_ids?: string[];
  priority?: string[];
  status?: string[];
  due_date_range?: {
    start: string;
    end: string;
  };
}

// Tipos para drag and drop
export interface DragEndEvent {
  active: {
    id: string;
    data: {
      current: {
        type: 'task' | 'project';
        item: KanbanTask | KanbanProject;
        columnId: string;
      };
    };
  };
  over: {
    id: string;
    data?: {
      current?: {
        type: 'column' | 'task' | 'project';
        columnId?: string;
      };
    };
  } | null;
}

// Tipos para movimentação de itens
export interface MoveItemRequest {
  item_id: string;
  item_type: 'task' | 'project';
  source_column: string;
  target_column: string;
  new_position: number;
  view_type: KanbanViewType;
}

// Tipos para resposta das APIs
export interface KanbanApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Tipos para configuração de colunas
export interface ColumnConfig {
  id: string;
  title: string;
  color?: string;
  limit?: number;
  collapsed?: boolean;
}

// Tipos para estatísticas
export interface KanbanStats {
  total_items: number;
  completed_items: number;
  in_progress_items: number;
  overdue_items: number;
  completion_rate: number;
}

// Tipos para notificações em tempo real
export interface KanbanNotification {
  type: 'item_moved' | 'item_created' | 'item_updated' | 'item_deleted';
  item_id: string;
  item_type: 'task' | 'project';
  column_id: string;
  user_id: string;
  timestamp: string;
  data: KanbanTask | KanbanProject | Record<string, unknown>;
}

// Tipos para modais
export interface TaskModalData {
  task?: KanbanTask;
  column_id: string;
  project_id?: string;
  mode: 'create' | 'edit' | 'view';
}

export interface ProjectModalData {
  project?: KanbanProject;
  column_id: string;
  mode: 'create' | 'edit' | 'view';
}

// Tipos para hooks personalizados
export interface UseKanbanDataOptions {
  view_type: KanbanViewType;
  filters?: KanbanFilters;
  auto_refresh?: boolean;
  refresh_interval?: number;
}

export interface UseKanbanDragDropOptions {
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragEndEvent) => void;
}

export interface UseKanbanRealTimeOptions {
  view_type: KanbanViewType;
  project_id?: string;
  team_id?: string;
  onNotification?: (notification: KanbanNotification) => void;
}
