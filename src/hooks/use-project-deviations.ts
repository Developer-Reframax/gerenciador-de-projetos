'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ProjectDeviationWithUsers } from '@/types/database'

interface UseProjectDeviationsReturn {
  deviations: ProjectDeviationWithUsers[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useProjectDeviations(projectId: string): UseProjectDeviationsReturn {
  const [deviations, setDeviations] = useState<ProjectDeviationWithUsers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeviations = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/deviations`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar desvios')
      }

      setDeviations(result.deviations || [])
    } catch (err) {
      console.error('Erro ao buscar desvios:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setDeviations([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchDeviations()
  }, [fetchDeviations])

  const refetch = () => {
    fetchDeviations()
  }

  return {
    deviations,
    loading,
    error,
    refetch
  }
}
