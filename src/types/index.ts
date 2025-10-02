import { Database } from './database'
import { User } from './user'

// Re-exportar apenas o tipo Database
export type { Database }

// Re-exportar tipos de usuário
export * from './user'

// Re-exportar tipos de notificações
export * from './notifications'

// Tipos para formulários
export interface CreateProjectForm {
  name: string
  description?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled'
  priority: 'tactical' | 'important' | 'priority'
  start_date?: string
  end_date?: string
  team_members?: string[]
}

export interface CreateTaskForm {
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'tactical' | 'important' | 'priority'
  estimated_hours?: number
  project_id: string
  assigned_to?: string
}

export interface CreateRiskForm {
  name: string
  description?: string
  stage_id: string
  status?: Database['public']['Enums']['risk_status']
  impact: Database['public']['Enums']['risk_impact']
  probability: Database['public']['Enums']['risk_probability']
  responsible_id: string
  identification_date: string
  expected_resolution_date?: string
}

export interface CreateImpedimentForm {
  description: string
  stage_id: string
  identification_date: string
  responsible_id: string
  expected_resolution_date?: string
  criticality?: Database['public']['Enums']['impediment_criticality']
  status?: Database['public']['Enums']['impediment_status']
}

// Tipos para componentes
export interface ProjectCardProps {
  project: Database['public']['Tables']['projects']['Row']
  onEdit?: (project: Database['public']['Tables']['projects']['Row']) => void
  onDelete?: (projectId: string) => void
}

export interface TaskCardProps {
  task: Database['public']['Tables']['tasks']['Row']
  onEdit?: (task: Database['public']['Tables']['tasks']['Row']) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: 'todo' | 'in_progress' | 'completed') => void
}

export interface RiskCardProps {
  risk: Database['public']['Tables']['risks']['Row'] & {
    stage?: { id: string; name: string }
    assigned_user?: { id: string; email: string; full_name: string; avatar_url?: string }
  }
  onEdit?: (risk: Database['public']['Tables']['risks']['Row']) => void
  onDelete?: (riskId: string) => void
  onStatusChange?: (riskId: string, status: Database['public']['Enums']['risk_status']) => void
}

export interface ImpedimentCardProps {
  impediment: Database['public']['Tables']['impediments']['Row'] & {
    stage?: { id: string; name: string }
    assigned_user?: { id: string; email: string; full_name: string; avatar_url?: string }
  }
  onEdit?: (impediment: Database['public']['Tables']['impediments']['Row']) => void
  onDelete?: (impedimentId: string) => void
  onStatusChange?: (impedimentId: string, status: Database['public']['Enums']['impediment_status']) => void
}

// Tipos para filtros e ordenação
export interface ProjectFilters {
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled'
  priority?: 'tactical' | 'important' | 'priority'
  owner_id?: string
  search?: string
}

export interface TaskFilters {
  status?: 'todo' | 'in_progress' | 'completed'
  priority?: 'tactical' | 'important' | 'priority'
  assigned_to?: string
  project_id?: string
  search?: string
}

export interface RiskFilters {
  status?: Database['public']['Enums']['risk_status']
  impact?: Database['public']['Enums']['risk_impact']
  probability?: Database['public']['Enums']['risk_probability']
  responsible_id?: string
  project_id?: string
  stage_id?: string
  search?: string
}

export interface ImpedimentFilters {
  status?: Database['public']['Enums']['impediment_status']
  criticality?: Database['public']['Enums']['impediment_criticality']
  responsible_id?: string
  project_id?: string
  stage_id?: string
  search?: string
}

export interface ProjectLogFilters {
  page?: number
  limit?: number
  action_type?: 'INSERT' | 'UPDATE' | 'DELETE'
  table_name?: string
  user_id?: string
  start_date?: string
  end_date?: string
  search?: string
}

// Tipos para logs de projeto
export interface ProjectLog {
  id: string
  project_id: string
  table_name: string
  record_id: string
  action_type: 'INSERT' | 'UPDATE' | 'DELETE'
  user_id: string | null
  created_at: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  description: string | null
  user?: {
    id: string
    email: string
    full_name: string
    avatar_url?: string
  }
}

export type SortOrder = 'asc' | 'desc'

export interface SortConfig {
  field: string
  order: SortOrder
}

// Tipos para API responses
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}

// Tipos para contextos
export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

export interface ProjectContextType {
  projects: Database['public']['Tables']['projects']['Row'][]
  loading: boolean
  createProject: (project: CreateProjectForm) => Promise<void>
  updateProject: (id: string, updates: Partial<Database['public']['Tables']['projects']['Update']>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  fetchProjects: (filters?: ProjectFilters) => Promise<void>
}

// Tipos para entidades estratégicas
export interface StrategicObjective {
  id: string
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface StrategicPillar {
  id: string
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface Tag {
  id: string
  name: string
  color?: string
  created_at?: string
  updated_at?: string
}

export interface ProjectTag {
  id: string
  project_id: string
  tag_id: string
  created_at?: string
  tags?: Tag
}

// Tipos para formulários estratégicos
export interface CreateStrategicObjectiveForm {
  name: string
  description?: string
}

export interface CreateStrategicPillarForm {
  name: string
  description?: string
}

export interface CreateTagForm {
  name: string
  color?: string
}

export interface UpdateProjectStrategicForm {
  strategic_objective_id?: string | null
  strategic_pillar_id?: string | null
  request_date?: string | null
  committee_approval_date?: string | null
  start_date?: string | null
  due_date?: string | null
  real_start_date?: string | null
  real_end_date?: string | null
  budget?: number | null
  owner_name?: string | null
  direct_responsibles?: string | null
  requesting_area?: string[] | null
  planned_budget?: number | null
  used_budget?: number | null
  tag_ids?: string[]
  area_ids?: string[]
  stakeholder_ids?: string[]
  lessons_learned?: string | null
}

// Tipos para respostas da API estratégica
export interface StrategicObjectivesResponse {
  data: StrategicObjective[]
}

export interface StrategicPillarsResponse {
  data: StrategicPillar[]
}

export interface TagsResponse {
  data: Tag[]
}

export interface Area {
  id: string
  name: string
  description?: string
  color: string
  created_at?: string
  updated_at?: string
}

export interface Stakeholder {
  id: string
  user_id: string
  user_name: string
  user_email: string
  role?: string
  created_at?: string
}

export interface LessonsLearned {
  content: string
  updated_at?: string
}

export interface ProjectStrategicInfoResponse {
  id: string
  name: string
  strategic_objective_id?: string | null
  strategic_pillar_id?: string | null
  request_date?: string | null
  committee_approval_date?: string | null
  start_date?: string | null
  due_date?: string | null
  real_start_date?: string | null
  real_end_date?: string | null
  budget?: number | null
  owner_name?: string | null
  direct_responsibles?: string | null
  requesting_area?: string[] | null
  planned_budget?: number | null
  used_budget?: number | null
  strategic_objective?: StrategicObjective | null
  strategic_pillar?: StrategicPillar | null
  tags: Tag[]
  areas: Area[]
  stakeholders: Stakeholder[]
  lessons_learned?: string | null
  // Indicadores informativos (não editáveis)
  total_tasks?: number
  completed_tasks?: number
  pending_tasks?: number
  progress_percentage?: number
  created_at: string
  updated_at: string
}

// Tipos para hooks
export interface UseProjectsReturn {
  projects: Database['public']['Tables']['projects']['Row'][]
  loading: boolean
  error: string | null
  createProject: (project: CreateProjectForm) => Promise<void>
  updateProject: (id: string, updates: Partial<Database['public']['Tables']['projects']['Update']>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export interface UseTasksReturn {
  tasks: Database['public']['Tables']['tasks']['Row'][]
  loading: boolean
  error: string | null
  createTask: (task: CreateTaskForm) => Promise<void>
  updateTask: (id: string, updates: Partial<Database['public']['Tables']['tasks']['Update']>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export interface UseRisksReturn {
  risks: (Database['public']['Tables']['risks']['Row'] & {
    stage?: { id: string; name: string }
    assigned_user?: { id: string; email: string; full_name: string; avatar_url?: string }
  })[]
  loading: boolean
  error: string | null
  createRisk: (risk: CreateRiskForm) => Promise<void>
  updateRisk: (id: string, updates: Partial<Database['public']['Tables']['risks']['Update']>) => Promise<void>
  deleteRisk: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export interface UseImpedimentsReturn {
  impediments: (Database['public']['Tables']['impediments']['Row'] & {
    stage?: { id: string; name: string }
    assigned_user?: { id: string; email: string; full_name: string; avatar_url?: string }
  })[]
  loading: boolean
  error: string | null
  createImpediment: (impediment: CreateImpedimentForm) => Promise<void>
  updateImpediment: (id: string, updates: Partial<Database['public']['Tables']['impediments']['Update']>) => Promise<void>
  deleteImpediment: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

// Tipos globais para riscos e impedimentos
export interface GlobalRisk {
  id: string
  stage_id: string
  name: string
  description?: string
  status: Database['public']['Enums']['risk_status']
  impact: Database['public']['Enums']['risk_impact']
  probability: Database['public']['Enums']['risk_probability']
  responsible_id: string
  identification_date: string
  expected_resolution_date?: string
  created_at?: string
  updated_at?: string
  stage?: {
    id: string
    name: string
    project?: {
      id: string
      name: string
    }
  }
  responsible_user?: {
    id: string
    email: string
    full_name: string
    avatar_url?: string
  }
}

export interface GlobalImpediment {
  id: string
  stage_id: string
  description: string
  identification_date: string
  responsible_id: string
  expected_resolution_date?: string
  criticality: Database['public']['Enums']['impediment_criticality']
  status: Database['public']['Enums']['impediment_status']
  created_at?: string
  updated_at?: string
  stage?: {
    id: string
    name: string
    project?: {
      id: string
      name: string
    }
  }
  responsible_user?: {
    id: string
    email: string
    full_name: string
    avatar_url?: string
  }
}

// Tipos para itens de trabalho unificados
export interface WorkItem {
  id: string
  title: string
  description?: string
  status: string
  priority: 'tactical' | 'important' | 'priority'
  type: 'task' | 'risk' | 'impediment'
  stage_id?: string
  project_id: string
  assigned_to?: string
  created_at: string
  updated_at: string
  stage?: { id: string; name: string }
  assigned_user?: { id: string; email: string; full_name: string; avatar_url?: string }
}

export interface StageWorkItemsResponse {
  stage: { id: string; name: string }
  items: {
    tasks: WorkItem[]
    risks: WorkItem[]
    impediments: WorkItem[]
    total: number
  }
}
