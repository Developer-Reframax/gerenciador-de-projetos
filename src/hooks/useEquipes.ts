import { useState, useEffect, useCallback } from 'react'
import { Equipe } from '@/types/kanban'

interface UseEquipesReturn {
  equipes: Equipe[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useEquipes(): UseEquipesReturn {
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchEquipes = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/kanban/equipes')
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar equipes: ${response.statusText}`)
      }

      const data = await response.json()
      setEquipes(data.equipes || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(errorMessage)
      setEquipes([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = useCallback(() => {
    fetchEquipes()
  }, [fetchEquipes])

  useEffect(() => {
    fetchEquipes()
  }, [fetchEquipes])

  return {
    equipes,
    isLoading,
    error,
    refetch
  }
}