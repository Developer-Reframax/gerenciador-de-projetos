// Tipos para o Sistema Kanban Reformulado
import { DragEndEvent } from '@dnd-kit/core'

export interface Pessoa {
  id: string
  nome: string
  email: string
  avatar_url?: string
  equipe?: string
  total_tarefas: number
  tarefas_pendentes: number
  tarefas_concluidas: number
}

export interface TarefaUnificada {
  id: string
  titulo: string
  tipo: 'projeto' | 'workflow'
  projeto_nome: string
  etapa_nome: string
  status: string
  prioridade: 'baixa' | 'media' | 'alta'
  prazo?: string
  assigned_to?: string
  criado_em: string
}

export interface Equipe {
  id: string
  name: string
  description?: string
}

export interface KanbanMetadata {
  total_tasks?: number
  total_projects?: number
  completed_tasks?: number
  last_updated?: string
}

export interface KanbanData {
  pessoas: Pessoa[]
  tarefasPorPessoa: Record<string, TarefaUnificada[]>
  metadata?: KanbanMetadata
  columns?: KanbanColumn[]
  assignee_columns?: KanbanColumn[]
  status_columns?: KanbanColumn[]
}

export interface KanbanFilters {
  tipoVisao: 'pessoa' | 'equipe'
  equipeId?: string
}

export interface MoverTarefaRequest {
  tarefa_id: string
  tipo_tarefa: 'projeto' | 'workflow'
  novo_responsavel_id: string
}

// Response types para as APIs
export interface KanbanApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PessoasResponse {
  pessoas: Pessoa[]
}

export interface TarefasPorPessoaResponse {
  tarefas_por_pessoa: Record<string, TarefaUnificada[]>
}

export interface EquipesResponse {
  equipes: Equipe[]
}

// Hook types
export interface UseKanbanDataProps {
  tipoVisao: 'pessoa' | 'equipe'
  equipeId?: string
}

export interface UseKanbanDataReturn {
  pessoas: Pessoa[]
  tarefasPorPessoa: Record<string, TarefaUnificada[]>
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export interface UseKanbanDragDropReturn {
  handleDragEnd: (event: DragEndEvent) => void
  moverTarefa: (tarefaId: string, tipoTarefa: 'projeto' | 'workflow', novoResponsavelId: string) => Promise<void>
}

// Tipos adicionais para o sistema Kanban completo
export interface KanbanTask {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'in_review' | 'completed'
  priority: 'baixa' | 'media' | 'alta'
  assigned_to?: string
  assigned_avatar?: string
  project_id?: string
  project_name?: string
  due_date?: string
  position?: number
  created_at: string
  updated_at: string
}

export interface KanbanProject {
  id: string
  name: string
  description?: string
  status: string
  priority?: 'baixa' | 'media' | 'alta'
  team_id?: string
  team_name?: string
  total_tasks?: number
  completed_tasks?: number
  progress?: number
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface KanbanColumn {
  id: string
  title: string
  tasks: KanbanTask[]
  projects?: KanbanProject[]
  order: number
}

export type KanbanViewType = 'pessoa' | 'equipe' | 'status' | 'project' | 'assignee'

export interface KanbanProjectData {
  project: KanbanProject
  columns: KanbanColumn[]
  tasks: KanbanTask[]
}

export interface KanbanAssigneeData {
  assignee: Pessoa
  tasks: KanbanTask[]
}

export interface KanbanProjectStatusData {
  status: string
  projects: KanbanProject[]
}