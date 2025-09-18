// Tipos específicos para usuários
import { Database } from './database'

// Tipo User baseado no schema do database
export type User = Database['public']['Tables']['users']['Row']

export interface UserStats {
  total: number
  active: number
  inactive: number
  by_role: {
    admin: number
    editor: number
    membro: number
    user: number
  }
}

export interface CreateUserForm {
  email: string
  full_name: string
  role: 'admin' | 'editor' | 'membro' | 'user'
  bio?: string
  timezone?: string
  language?: string
}

export interface UpdateUserForm {
  full_name?: string
  role?: 'admin' | 'editor' | 'membro' | 'user'
  bio?: string
  timezone?: string
  language?: string
  theme?: string
  is_active?: boolean
  notification_preferences?: {
    comments: boolean
    project_updates: boolean
    task_assignments: boolean
    push_notifications: boolean
    email_notifications: boolean
  }
}

export interface UserFilters {
  search?: string
  role?: 'all' | 'admin' | 'editor' | 'membro' | 'user'
  status?: 'all' | 'active' | 'inactive'
}

export const USER_ROLES = {
  admin: 'Administrador',
  editor: 'Editor', 
  membro: 'Membro',
  user: 'Usuário'
} as const

export const USER_ROLE_DESCRIPTIONS = {
  admin: 'Acesso total ao sistema, pode gerenciar usuários e configurações',
  editor: 'Pode criar e editar projetos, tarefas e conteúdo',
  membro: 'Pode participar de projetos e executar tarefas atribuídas',
  user: 'Acesso básico, pode visualizar projetos e tarefas'
} as const
