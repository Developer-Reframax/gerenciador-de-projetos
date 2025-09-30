'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { 
  WorkflowStage, 
  CreateWorkflowStageData, 
  UpdateWorkflowStageData
} from '@/types/workflow'

// Interfaces para respostas da API
interface WorkflowStagesResponse {
  stages: WorkflowStage[]
}

interface WorkflowStageResponse {
  stage: WorkflowStage
}

export function useWorkflowStages(workflowId: string) {
  const [stages, setStages] = useState<WorkflowStage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStages = useCallback(async () => {
    if (!workflowId) return

    try {
      setLoading(true)
      setError(null)

      const data = await apiClient.get<WorkflowStagesResponse>(`/api/workflows/${workflowId}/work-items`)
      setStages(data.stages || [])
    } catch (err) {
      console.error('Erro ao buscar etapas do workflow:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [workflowId])

  useEffect(() => {
    fetchStages()
  }, [fetchStages])

  return {
    stages,
    loading,
    error,
    refetch: fetchStages
  }
}

export function useWorkflowStageMutations(workflowId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createStage = async (data: CreateWorkflowStageData): Promise<WorkflowStage> => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiClient.post<WorkflowStageResponse>(
        `/api/workflows/${workflowId}/work-items`, 
        data as unknown as Record<string, unknown>
      )
      return result.stage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateStage = async (stageId: string, data: UpdateWorkflowStageData): Promise<WorkflowStage> => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiClient.put<WorkflowStageResponse>(
        `/api/workflows/${workflowId}/work-items/${stageId}`, 
        data as unknown as Record<string, unknown>
      )
      return result.stage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteStage = async (stageId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      await apiClient.delete(`/api/workflows/${workflowId}/work-items/${stageId}`)
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const reorderStages = async (stageIds: string[]): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      await apiClient.put(`/api/workflows/${workflowId}/work-items/reorder`, {
        stage_ids: stageIds
      })
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
    loading,
    error
  }
}