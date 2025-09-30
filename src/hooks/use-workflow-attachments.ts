'use client'

import { useState, useEffect, useCallback } from 'react'
import { WorkflowAttachment, UpdateWorkflowAttachmentData } from '@/types/workflow'
import { toast } from 'sonner'

interface UseWorkflowAttachmentsReturn {
  attachments: WorkflowAttachment[]
  loading: boolean
  uploading: boolean
  error: string | null
  uploadFile: (file: File, description?: string) => Promise<WorkflowAttachment | null>
  uploadAttachment: (file: File, description?: string) => Promise<WorkflowAttachment | null>
  updateAttachment: (attachmentId: string, data: UpdateWorkflowAttachmentData) => Promise<WorkflowAttachment | null>
  deleteAttachment: (attachmentId: string) => Promise<boolean>
  downloadAttachment: (attachmentId: string, filename: string) => Promise<void>
  refreshAttachments: () => Promise<void>
}

export function useWorkflowAttachments(workflowId: string): UseWorkflowAttachmentsReturn {
  const [attachments, setAttachments] = useState<WorkflowAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para buscar anexos
  const fetchAttachments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/workflows/${workflowId}/attachments`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao carregar anexos')
      }

      const data = await response.json()
      setAttachments(data.attachments || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao buscar anexos:', err)
    } finally {
      setLoading(false)
    }
  }, [workflowId])

  // Função para upload de arquivo
  const uploadFile = async (file: File, description?: string): Promise<WorkflowAttachment | null> => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      if (description) {
        formData.append('description', description)
      }

      const response = await fetch(`/api/workflows/${workflowId}/attachments`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao fazer upload do arquivo')
      }

      const result = await response.json()
      const newAttachment = result.attachment

      // Adicionar o novo anexo à lista
      setAttachments(prev => [newAttachment, ...prev])
      
      toast.success('Arquivo enviado com sucesso!')
      return newAttachment
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload'
      toast.error(errorMessage)
      console.error('Erro ao fazer upload:', err)
      return null
    } finally {
      setUploading(false)
    }
  }

  // Alias para uploadFile (para compatibilidade)
  const uploadAttachment = uploadFile

  // Função para atualizar anexo
  const updateAttachment = async (attachmentId: string, data: UpdateWorkflowAttachmentData): Promise<WorkflowAttachment | null> => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/attachments/${attachmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar anexo')
      }

      const result = await response.json()
      const updatedAttachment = result.attachment

      // Atualizar o anexo na lista
      setAttachments(prev => 
        prev.map(attachment => 
          attachment.id === attachmentId ? updatedAttachment : attachment
        )
      )
      
      toast.success('Anexo atualizado com sucesso!')
      return updatedAttachment
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar anexo'
      toast.error(errorMessage)
      console.error('Erro ao atualizar anexo:', err)
      return null
    }
  }

  // Função para deletar anexo
  const deleteAttachment = async (attachmentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/attachments/${attachmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar anexo')
      }

      // Remover o anexo da lista
      setAttachments(prev => prev.filter(attachment => attachment.id !== attachmentId))
      
      toast.success('Anexo removido com sucesso!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar anexo'
      toast.error(errorMessage)
      console.error('Erro ao deletar anexo:', err)
      return false
    }
  }

  // Função para download de anexo
  const downloadAttachment = async (attachmentId: string, filename: string): Promise<void> => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/attachments/${attachmentId}`)
      
      if (!response.ok) {
        throw new Error('Erro ao obter URL de download')
      }

      const data = await response.json()
      const link = document.createElement('a')
      link.href = data.attachment.download_url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao baixar arquivo'
      toast.error(errorMessage)
      console.error('Erro no download:', err)
    }
  }

  // Função para atualizar anexos
  const refreshAttachments = async () => {
    await fetchAttachments()
  }

  // Carregar anexos na inicialização
  useEffect(() => {
    if (workflowId) {
      fetchAttachments()
    }
  }, [workflowId, fetchAttachments])

  return {
    attachments,
    loading,
    uploading,
    error,
    uploadFile,
    uploadAttachment,
    updateAttachment,
    deleteAttachment,
    downloadAttachment,
    refreshAttachments
  }
}

// Hook para anexo individual
export function useWorkflowAttachment(workflowId: string, attachmentId: string) {
  const [attachment, setAttachment] = useState<WorkflowAttachment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAttachment = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/workflows/${workflowId}/attachments/${attachmentId}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao carregar anexo')
        }

        const data = await response.json()
        setAttachment(data.attachment)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(errorMessage)
        console.error('Erro ao buscar anexo:', err)
      } finally {
        setLoading(false)
      }
    }

    if (workflowId && attachmentId) {
      fetchAttachment()
    }
  }, [workflowId, attachmentId])

  return { attachment, loading, error }
}