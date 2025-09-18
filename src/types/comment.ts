// Tipos para o sistema de comentários

export type CommentType = 'comment' | 'status_change' | 'system'
export type CommentContext = 'task' | 'project' | 'team'

export interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
}

export interface Comment {
  id: string
  context: CommentContext
  context_id: string
  type: CommentType
  content: string
  content_html?: string
  author_id: string
  parent_id?: string
  mentioned_users: string[]
  reactions: Record<string, string[]> // emoji -> array of user_ids
  is_edited: boolean
  is_pinned: boolean
  is_internal: boolean
  created_at: string
  updated_at: string
  edited_at?: string
  author: User
  replies?: Comment[]
}

export interface CreateCommentData {
  content: string
  type?: CommentType
  parent_id?: string
  mentioned_users?: string[]
  is_internal?: boolean
}

export interface UpdateCommentData {
  content?: string
  is_pinned?: boolean
  is_internal?: boolean
}

export interface CommentReaction {
  emoji: string
  users: string[]
  count: number
}

import { MessageCircle, AlertTriangle, CheckCircle, LucideIcon } from 'lucide-react'

export interface CommentTypeConfig {
  label: string
  color: string
  icon: LucideIcon
}

// Configuração completa dos tipos de comentário
export const COMMENT_TYPE_CONFIG: Record<CommentType, CommentTypeConfig> = {
  comment: {
    label: 'Comentário',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: MessageCircle
  },
  status_change: {
    label: 'Mudança de Status',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: CheckCircle
  },

  system: {
    label: 'Sistema',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertTriangle
  }
}
