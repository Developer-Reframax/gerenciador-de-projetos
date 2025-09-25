'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { UseImpedimentsReturn, CreateImpedimentForm } from '@/types'
import { Database } from '@/types/database'

type Impediment = Database['public']['Tables']['impediments']['Row'] & {
  stage?: { id: string; name: string }
  assigned_user?: { id: string; email: string; full_name: string; avatar_url?: string }
}

interface ImpedimentsResponse {
  impediments: Impediment[]
}

export function useImpediments(projectId: string): UseImpedimentsReturn {
  const [impediments, setImpediments] = useState<Impediment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchImpediments = useCallback(async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.get<ImpedimentsResponse>(`/api/projects/${projectId}/impediments`)
      setImpediments(data.impediments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar impedimentos')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const createImpediment = useCallback(async (impedimentData: CreateImpedimentForm) => {
    try {
      await apiClient.post(`/api/projects/${projectId}/impediments`, impedimentData as unknown as Record<string, unknown>)
      await fetchImpediments()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar impedimento')
    }
  }, [projectId, fetchImpediments])

  const updateImpediment = useCallback(async (impedimentId: string, impedimentData: Partial<Database['public']['Tables']['impediments']['Update']>) => {
    try {
      await apiClient.put(`/api/projects/${projectId}/impediments`, { id: impedimentId, ...impedimentData })
      await fetchImpediments()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar impedimento')
    }
  }, [projectId, fetchImpediments])

  const deleteImpediment = useCallback(async (impedimentId: string) => {
    try {
      await apiClient.delete(`/api/projects/${projectId}/impediments/${impedimentId}`)
      await fetchImpediments()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir impedimento')
    }
  }, [projectId, fetchImpediments])

  useEffect(() => {
    fetchImpediments()
  }, [fetchImpediments])

  return {
    impediments,
    loading,
    error,
    refetch: fetchImpediments,
    createImpediment,
    updateImpediment,
    deleteImpediment
  }
}