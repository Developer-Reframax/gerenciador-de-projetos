'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { Database } from '@/types/database'

type GlobalRisk = Database['public']['Tables']['risks']['Row'] & {
  stage?: {
    id: string
    name: string
    project: {
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

interface GlobalRisksResponse {
  risks: GlobalRisk[]
}

export interface UseGlobalRisksReturn {
  risks: GlobalRisk[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  deleteRisk: (riskId: string, projectId: string) => Promise<void>
}

export function useGlobalRisks(): UseGlobalRisksReturn {
  const [risks, setRisks] = useState<GlobalRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRisks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.get<GlobalRisksResponse>('/api/risks')
      setRisks(data.risks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar riscos')
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteRisk = useCallback(async (riskId: string, projectId: string) => {
    try {
      await apiClient.delete(`/api/projects/${projectId}/risks/${riskId}`)
      await fetchRisks()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir risco')
    }
  }, [fetchRisks])

  useEffect(() => {
    fetchRisks()
  }, [fetchRisks])

  return {
    risks,
    loading,
    error,
    refetch: fetchRisks,
    deleteRisk
  }
}