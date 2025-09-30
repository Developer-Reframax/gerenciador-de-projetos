import { z } from 'zod'
import type { CommentType } from './comment'

export interface Workflow {
  id: string
  name: string
  description: string | null
  category: WorkflowCategory
  status: WorkflowStatus
  priority: WorkflowPriority
  created_by: string
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string

  // Relacionamentos
  creator?: {
    id: string
    email: string
    full_name: string | null
  }

  stages?: WorkflowStage[]
  tasks?: WorkflowTask[]
  attachments?: WorkflowAttachment[]
  comments?: WorkflowComment[]
  logs?: WorkflowLog[]
  impediments?: WorkflowImpediment[]
  strategic_info?: WorkflowStrategicInfo

  // Propriedades calculadas
  total_stages?: number
  completed_stages?: number
  total_tasks?: number
  completed_tasks?: number
  progress_percentage?: number

  _count?: {
    stages: number
    tasks: number
    completed_tasks: number
    attachments: number
    comments: number
    impediments: number
  }
}

export type WorkflowCategory = 'iniciativa' | 'melhoria'

export type WorkflowStatus = 
  | 'planejamento'
  | 'em_andamento'
  | 'concluido'
  | 'cancelado'

export interface WorkflowStage {
  id: string
  workflow_id: string
  name: string
  description: string | null
  position: number
  status: 'ativo' | 'inativo'
  created_by: string
  created_at: string
  updated_at: string

  tasks?: WorkflowTask[]
}

export interface WorkflowTask {
  id: string
  workflow_id: string
  stage_id: string | null
  title: string
  description: string | null
  status: WorkflowTaskStatus
  priority: WorkflowPriority
  assigned_to: string | null
  due_date: string | null
  position: number
  created_by: string
  created_at: string
  updated_at: string

  // Relacionamentos
  assignee?: {
    id: string
    email: string
    full_name: string | null
  }
  creator?: {
    id: string
    email: string
    full_name: string | null
  }
  stage?: WorkflowStage
}

export type WorkflowTaskStatus = 
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'bloqueada'

export type WorkflowPriority = 
  | 'baixa'
  | 'media'
  | 'alta'
  | 'critica'

export interface WorkflowAttachment {
  id: string
  workflow_id: string
  filename: string
  original_filename: string
  file_path: string
  file_type: string | null
  mime_type: string | null
  file_size: number | null
  description: string | null
  uploaded_by: string
  created_at: string
  updated_at: string

  // Relacionamentos
  uploader?: {
    id: string
    email: string
    full_name: string | null
  }
}

export interface WorkflowComment {
  id: string
  workflow_id: string
  author_id: string
  content: string
  type: CommentType
  parent_id: string | null
  mentioned_users: string[]
  reactions: Record<string, string[]> // emoji -> array of user_ids
  is_edited: boolean
  is_pinned: boolean
  is_internal: boolean
  created_at: string
  updated_at: string
  edited_at: string | null

  // Relacionamentos
  author?: {
    id: string
    email: string
    full_name: string | null
  }
  replies?: WorkflowComment[]
  parent?: WorkflowComment
}

export interface WorkflowLog {
  id: string
  workflow_id: string
  user_id: string
  action: string
  description: string | null
  metadata: Record<string, unknown> | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string

  // Relacionamentos
  user?: {
    id: string
    email: string
    full_name: string | null
  }
}

export interface WorkflowImpediment {
  id: string
  workflow_id: string
  task_id: string | null
  title: string
  description: string | null
  status: WorkflowImpedimentStatus
  severity: WorkflowPriority
  reported_by: string
  reported_date: string
  resolved_date: string | null
  created_at: string
  updated_at: string

  // Relacionamentos
  reporter?: {
    id: string
    email: string
    full_name: string | null
  }
  task?: WorkflowTask
}

export type WorkflowImpedimentStatus = 
  | 'aberto'
  | 'em_resolucao'
  | 'resolvido'

export interface WorkflowStrategicInfo {
  id: string
  workflow_id: string
  strategic_data: Record<string, unknown> | null
  metrics: Record<string, unknown> | null
  kpis: Record<string, unknown> | null
  actual_start_date: string | null
  actual_end_date: string | null
  tags: string[] | null
  created_by: string
  created_at: string
  updated_at: string

  // Relacionamentos
  creator?: {
    id: string
    email: string
    full_name: string | null
  }
}

// Tipos para criação e atualização
export interface CreateWorkflowData {
  name: string
  description?: string
  category: WorkflowCategory
  priority?: WorkflowPriority
  start_date?: string
  end_date?: string
}

export interface UpdateWorkflowData extends Partial<CreateWorkflowData> {
  id: string
  status?: WorkflowStatus
}

export interface CreateWorkflowStageData {
  name: string
  description?: string
  position: number
}

export interface UpdateWorkflowStageData {
  name?: string
  description?: string
  position?: number
  status?: string
}

export interface CreateWorkflowTaskData {
  title: string
  description?: string
  stage_id?: string
  priority?: WorkflowPriority
  assigned_to?: string
  due_date?: string
  position: number
}

export interface CreateWorkflowCommentData {
  content: string
  type?: CommentType
  parent_id?: string
  mentioned_users?: string[]
  is_internal?: boolean
}

export interface UpdateWorkflowCommentData {
  content?: string
  is_pinned?: boolean
  is_internal?: boolean
  mentioned_users?: string[]
}

export interface CreateWorkflowImpedimentData {
  title: string
  description?: string
  task_id?: string
  severity?: WorkflowPriority
}

export interface CreateWorkflowAttachmentData {
  filename: string
  original_filename: string
  file_path: string
  file_type?: string
  mime_type?: string
  file_size?: number
  description?: string
}

export interface UpdateWorkflowAttachmentData {
  description?: string
}

export interface CreateWorkflowStrategicInfoData {
  strategic_data?: Record<string, unknown> | null
  metrics?: Record<string, unknown> | null
  kpis?: Record<string, unknown> | null
  actual_start_date?: string
  actual_end_date?: string
  tags?: string[] | null
}

export interface UpdateWorkflowStrategicInfoData {
  strategic_data?: Record<string, unknown> | null
  metrics?: Record<string, unknown> | null
  kpis?: Record<string, unknown> | null
  actual_start_date?: string
  actual_end_date?: string
  tags?: string[] | null
}

// Filtros
export interface WorkflowFilters {
  status?: WorkflowStatus[]
  category?: WorkflowCategory[]
  priority?: WorkflowPriority[]
  created_by?: string
  search?: string
  start_date?: string
  end_date?: string
}

export interface WorkflowTaskFilters {
  status?: WorkflowTaskStatus[]
  priority?: WorkflowPriority[]
  assigned_to?: string
  stage_id?: string
  search?: string
}

// Estatísticas
export interface WorkflowStats {
  total: number
  by_status: Record<WorkflowStatus, number>
  by_category: Record<WorkflowCategory, number>
  by_priority: Record<WorkflowPriority, number>
  completion_rate: number
  total_tasks: number
  completed_tasks: number
}

// Constantes e labels
export const WORKFLOW_CATEGORY_LABELS: Record<WorkflowCategory, string> = {
  iniciativa: 'Iniciativa',
  melhoria: 'Melhoria'
}

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado'
}

export const WORKFLOW_TASK_STATUS_LABELS: Record<WorkflowTaskStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  bloqueada: 'Bloqueada'
}

export const WORKFLOW_PRIORITY_LABELS: Record<WorkflowPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica'
}

export const WORKFLOW_IMPEDIMENT_STATUS_LABELS: Record<WorkflowImpedimentStatus, string> = {
  aberto: 'Aberto',
  em_resolucao: 'Em Resolução',
  resolvido: 'Resolvido'
}

// Cores para status
export const WORKFLOW_STATUS_COLORS: Record<WorkflowStatus, string> = {
  planejamento: 'bg-blue-100 text-blue-800',
  em_andamento: 'bg-yellow-100 text-yellow-800',
  concluido: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800'
}

export const WORKFLOW_CATEGORY_COLORS: Record<WorkflowCategory, string> = {
  iniciativa: 'bg-purple-100 text-purple-800',
  melhoria: 'bg-indigo-100 text-indigo-800'
}

export const WORKFLOW_TASK_STATUS_COLORS: Record<WorkflowTaskStatus, string> = {
  pendente: 'bg-gray-100 text-gray-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  concluida: 'bg-green-100 text-green-800',
  bloqueada: 'bg-red-100 text-red-800'
}

export const WORKFLOW_PRIORITY_COLORS: Record<WorkflowPriority, string> = {
  baixa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800'
}

export const WORKFLOW_IMPEDIMENT_STATUS_COLORS: Record<WorkflowImpedimentStatus, string> = {
  aberto: 'bg-red-100 text-red-800',
  em_resolucao: 'bg-yellow-100 text-yellow-800',
  resolvido: 'bg-green-100 text-green-800'
}

// Schemas de validação Zod
export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.enum(['iniciativa', 'melhoria']),
  priority: z.enum(['baixa', 'media', 'alta', 'critica']).default('media'),
  start_date: z.string().optional(),
  end_date: z.string().optional()
})

export const updateWorkflowSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional(),
  category: z.enum(['iniciativa', 'melhoria']).optional(),
  status: z.enum(['planejamento', 'em_andamento', 'concluido', 'cancelado']).optional(),
  priority: z.enum(['baixa', 'media', 'alta', 'critica']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
})

export const createWorkflowStageSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  position: z.number().min(0).optional()
})

export const createWorkflowTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  stage_id: z.string().optional(),
  priority: z.enum(['baixa', 'media', 'alta', 'critica']).default('media'),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  position: z.number().min(0)
})

export const createWorkflowCommentSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  parent_id: z.string().optional()
})

export const createWorkflowImpedimentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  task_id: z.string().optional(),
  severity: z.enum(['baixa', 'media', 'alta', 'critica']).default('media')
})

export const createWorkflowAttachmentSchema = z.object({
  file_name: z.string().min(1, 'Nome do arquivo é obrigatório'),
  file_path: z.string().min(1, 'Caminho do arquivo é obrigatório'),
  file_type: z.string().optional(),
  file_size: z.number().optional(),
  description: z.string().optional()
})

export const createWorkflowStrategicInfoSchema = z.object({
  strategic_data: z.record(z.string(), z.unknown()).nullable().optional(),
  metrics: z.record(z.string(), z.unknown()).nullable().optional(),
  kpis: z.record(z.string(), z.unknown()).nullable().optional(),
  actual_start_date: z.string().optional(),
  actual_end_date: z.string().optional(),
  tags: z.array(z.string()).nullable().optional()
})

export const updateWorkflowStrategicInfoSchema = z.object({
  strategic_data: z.record(z.string(), z.unknown()).nullable().optional(),
  metrics: z.record(z.string(), z.unknown()).nullable().optional(),
  kpis: z.record(z.string(), z.unknown()).nullable().optional(),
  actual_start_date: z.string().optional(),
  actual_end_date: z.string().optional(),
  tags: z.array(z.string()).nullable().optional()
})