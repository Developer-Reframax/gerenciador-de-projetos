import { z } from 'zod'

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  priority: ProjectPriority
  owner_id: string
  team_id: string | null

  created_at: string
  updated_at: string
  start_date: string | null
  due_date: string | null
  progress: number
  progress_percentage: number | null
  budget: number | null
  total_tasks: number | null
  completed_tasks: number | null
  completed_at: string | null
  visibility: string | null
  settings: Record<string, unknown> | null
  color: string | null
  cover_image_url: string | null
  tags: string[] | null
  is_active: boolean | null
  deleted_at: string | null
  archived: boolean | null
  
  // Relacionamentos
  owner?: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  team?: {
    id: string
    name: string
    description: string | null
  }

  tasks?: Task[]
  _count?: {
    tasks: number
    completed_tasks: number
  }
}

export type ProjectStatus = 
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled'

export type ProjectPriority = 
  | 'tactical'
  | 'important'
  | 'priority'

export interface CreateProjectData {
  name: string
  description?: string
  status: ProjectStatus
  priority: ProjectPriority
  team_id?: string
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string
}

export interface ProjectFilters {
  status?: ProjectStatus[]
  priority?: ProjectPriority[]
  team_id?: string
  owner_id?: string
  search?: string
}

export interface ProjectStats {
  total: number
  completed: number
  in_progress: number
  not_started: number
  paused: number
  cancelled: number
  by_status?: Record<ProjectStatus, number>
  by_priority?: Record<ProjectPriority, number>
  completion_rate: number
}

// Tipos para tarefas (referência)
export interface Task {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'review' | 'blocked' | 'completed' | 'cancelled'
  priority: 'tactical' | 'important' | 'priority'
  project_id: string
  assignee_id: string | null
  created_at: string
  updated_at: string
  due_date: string | null
}

// Constantes úteis
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  not_started: 'Não Iniciado',
  in_progress: 'Em execução',
  paused: 'Paralisado',
  completed: 'Concluído',
  cancelled: 'Cancelado'
}

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  tactical: 'Tático',
  important: 'Importante',
  priority: 'Prioritário'
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

export const PROJECT_PRIORITY_COLORS: Record<ProjectPriority, string> = {
  tactical: 'bg-green-100 text-green-800',
  important: 'bg-yellow-100 text-yellow-800',
  priority: 'bg-red-100 text-red-800'
}

// Schemas de validação Zod
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'paused', 'completed', 'cancelled']).default('not_started'),
  priority: z.enum(['tactical', 'important', 'priority']).default('important'),
  team_id: z.string().optional(),
  progress_percentage: z.number().min(0).max(100).default(0)
})

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'paused', 'completed', 'cancelled']).optional(),
  priority: z.enum(['tactical', 'important', 'priority']).optional(),
  team_id: z.string().optional(),
  progress_percentage: z.number().min(0).max(100).optional()
})
