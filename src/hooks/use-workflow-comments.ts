'use client'

import { useState, useEffect, useCallback } from 'react'
import { WorkflowComment, CreateWorkflowCommentData, UpdateWorkflowCommentData } from '@/types/workflow'
import { toast } from 'sonner'

interface UseWorkflowCommentsReturn {
  comments: WorkflowComment[]
  loading: boolean
  error: string | null
  createComment: (data: CreateWorkflowCommentData) => Promise<WorkflowComment | null>
  updateComment: (commentId: string, data: UpdateWorkflowCommentData) => Promise<WorkflowComment | null>
  deleteComment: (commentId: string) => Promise<boolean>
  refreshComments: () => Promise<void>
}

export function useWorkflowComments(workflowId: string): UseWorkflowCommentsReturn {
  const [comments, setComments] = useState<WorkflowComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para buscar comentários
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/workflows/${workflowId}/comments`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao carregar comentários')
      }

      const data = await response.json()
      setComments(data.comments || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao buscar comentários:', err)
    } finally {
      setLoading(false)
    }
  }, [workflowId])

  // Função para criar comentário
  const createComment = async (data: CreateWorkflowCommentData): Promise<WorkflowComment | null> => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar comentário')
      }

      const result = await response.json()
      const newComment = result.comment

      // Adicionar o novo comentário à lista
      setComments(prev => [newComment, ...prev])
      
      toast.success('Comentário adicionado com sucesso!')
      return newComment
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar comentário'
      toast.error(errorMessage)
      console.error('Erro ao criar comentário:', err)
      return null
    }
  }

  // Função para atualizar comentário
  const updateComment = async (commentId: string, data: UpdateWorkflowCommentData): Promise<WorkflowComment | null> => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar comentário')
      }

      const result = await response.json()
      const updatedComment = result.comment

      // Atualizar o comentário na lista
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? updatedComment : comment
        )
      )
      
      toast.success('Comentário atualizado com sucesso!')
      return updatedComment
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar comentário'
      toast.error(errorMessage)
      console.error('Erro ao atualizar comentário:', err)
      return null
    }
  }

  // Função para deletar comentário
  const deleteComment = async (commentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar comentário')
      }

      // Remover o comentário da lista
      setComments(prev => prev.filter(comment => comment.id !== commentId))
      
      toast.success('Comentário removido com sucesso!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar comentário'
      toast.error(errorMessage)
      console.error('Erro ao deletar comentário:', err)
      return false
    }
  }

  // Função para atualizar comentários
  const refreshComments = async () => {
    await fetchComments()
  }

  // Carregar comentários na inicialização
  useEffect(() => {
    if (workflowId) {
      fetchComments()
    }
  }, [workflowId, fetchComments])

  return {
    comments,
    loading,
    error,
    createComment,
    updateComment,
    deleteComment,
    refreshComments
  }
}

// Hook para comentário individual
export function useWorkflowComment(workflowId: string, commentId: string) {
  const [comment, setComment] = useState<WorkflowComment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchComment = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/workflows/${workflowId}/comments/${commentId}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao carregar comentário')
        }

        const data = await response.json()
        setComment(data.comment)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(errorMessage)
        console.error('Erro ao buscar comentário:', err)
      } finally {
        setLoading(false)
      }
    }

    if (workflowId && commentId) {
      fetchComment()
    }
  }, [workflowId, commentId])

  return { comment, loading, error }
}