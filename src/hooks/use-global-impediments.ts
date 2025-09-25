'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { Database } from '@/types/database'

type GlobalImpediment = Database['public']['Tables']['impediments']['Row'] & {
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

interface GlobalImpedimentsResponse {
  impediments: GlobalImpediment[]
}

export interface UseGlobalImpedimentsReturn {
  impediments: GlobalImpediment[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  deleteImpediment: (impedimentId: string, projectId: string) => Promise<void>
}

export function useGlobalImpediments(): UseGlobalImpedimentsReturn {
  const [impediments, setImpediments] = useState<GlobalImpediment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchImpediments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.get<GlobalImpedimentsResponse>('/api/impediments')
      setImpediments(data.impediments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar impedimentos')
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteImpediment = useCallback(async (impedimentId: string, projectId: string) => {
    try {
      await apiClient.delete(`/api/projects/${projectId}/impediments/${impedimentId}`)
      await fetchImpediments()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir impedimento')
    }
  }, [fetchImpediments])

  useEffect(() => {
    fetchImpediments()
  }, [fetchImpediments])

  return {
    impediments,
    loading,
    error,
    refetch: fetchImpediments,
    deleteImpediment
  }
}