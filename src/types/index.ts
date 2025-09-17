import { Database } from './database'
import { User } from './user'

// Re-exportar apenas o tipo Database
export type { Database }

// Re-exportar tipos de usuário
export * from './user'

// Tipos para formulários
export interface CreateProjectForm {
  name: string
  description?: string
  status: 'planning' | 'active' | 'completed' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_date?: string
  end_date?: string
  team_members?: string[]
}

export interface CreateTaskForm {
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimated_hours?: number
  project_id: string
  assigned_to?: string
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

// Tipos para filtros e ordenação
export interface ProjectFilters {
  status?: 'planning' | 'active' | 'completed' | 'on_hold'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  owner_id?: string
  search?: string
}

export interface TaskFilters {
  status?: 'todo' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  project_id?: string
  search?: string
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
  real_start_date?: string | null
  real_end_date?: string | null
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
  real_start_date?: string | null
  real_end_date?: string | null
  strategic_objectives?: StrategicObjective | null
  strategic_pillars?: StrategicPillar | null
  tags: Tag[]
  areas: Area[]
  stakeholders: Stakeholder[]
  lessons_learned?: string | null
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