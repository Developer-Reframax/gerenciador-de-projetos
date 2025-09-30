'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { 
  WorkflowStrategicInfo, 
  CreateWorkflowStrategicInfoData,
  UpdateWorkflowStrategicInfoData
} from '@/types/workflow'

// Interfaces para respostas da API
interface WorkflowStrategicInfoResponse {
  strategicInfo: WorkflowStrategicInfo | null
}

export function useWorkflowStrategicInfo(workflowId: string) {
  const [strategicInfo, setStrategicInfo] = useState<WorkflowStrategicInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStrategicInfo = useCallback(async () => {
    if (!workflowId) return

    try {
      setLoading(true)
      setError(null)

      const data = await apiClient.get<WorkflowStrategicInfoResponse>(`/api/workflows/${workflowId}/strategic`)
      setStrategicInfo(data.strategicInfo)
    } catch (err) {
      console.error('Erro ao buscar informações estratégicas do workflow:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [workflowId])

  useEffect(() => {
    fetchStrategicInfo()
  }, [fetchStrategicInfo])

  return {
    strategicInfo,
    loading,
    error,
    refetch: fetchStrategicInfo
  }
}

export function useWorkflowStrategicMutations(workflowId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createStrategicInfo = async (data: CreateWorkflowStrategicInfoData): Promise<WorkflowStrategicInfo> => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiClient.post<WorkflowStrategicInfoResponse>(
        `/api/workflows/${workflowId}/strategic`, 
        data as unknown as Record<string, unknown>
      )
      
      if (!result.strategicInfo) {
        throw new Error('Erro ao criar informações estratégicas')
      }
      
      return result.strategicInfo
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateStrategicInfo = async (data: UpdateWorkflowStrategicInfoData): Promise<WorkflowStrategicInfo> => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiClient.put<WorkflowStrategicInfoResponse>(
        `/api/workflows/${workflowId}/strategic`, 
        data as unknown as Record<string, unknown>
      )
      
      if (!result.strategicInfo) {
        throw new Error('Erro ao atualizar informações estratégicas')
      }
      
      return result.strategicInfo
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteStrategicInfo = async (): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      await apiClient.delete(`/api/workflows/${workflowId}/strategic`)
      
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
    createStrategicInfo,
    updateStrategicInfo,
    deleteStrategicInfo,
    loading,
    error
  }
}