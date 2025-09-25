'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { UseRisksReturn, CreateRiskForm } from '@/types'
import { Database } from '@/types/database'

type Risk = Database['public']['Tables']['risks']['Row'] & {
  stage?: { id: string; name: string }
  assigned_user?: { id: string; email: string; full_name: string; avatar_url?: string }
}

interface RisksResponse {
  risks: Risk[]
}

export function useRisks(projectId: string): UseRisksReturn {
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRisks = useCallback(async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.get<RisksResponse>(`/api/projects/${projectId}/risks`)
      setRisks(data.risks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar riscos')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const createRisk = useCallback(async (riskData: CreateRiskForm) => {
    try {
      await apiClient.post(`/api/projects/${projectId}/risks`, riskData as unknown as Record<string, unknown>)
      await fetchRisks()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar risco')
    }
  }, [projectId, fetchRisks])

  const updateRisk = useCallback(async (riskId: string, riskData: Partial<Database['public']['Tables']['risks']['Update']>) => {
    try {
      await apiClient.put(`/api/projects/${projectId}/risks`, { id: riskId, ...riskData })
      await fetchRisks()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar risco')
    }
  }, [projectId, fetchRisks])

  const deleteRisk = useCallback(async (riskId: string) => {
    try {
      await apiClient.delete(`/api/projects/${projectId}/risks/${riskId}`)
      await fetchRisks()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir risco')
    }
  }, [projectId, fetchRisks])

  useEffect(() => {
    fetchRisks()
  }, [fetchRisks])

  return {
    risks,
    loading,
    error,
    refetch: fetchRisks,
    createRisk,
    updateRisk,
    deleteRisk
  }
}