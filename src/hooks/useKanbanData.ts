import { useState, useEffect, useCallback } from 'react'
import { UseKanbanDataProps, UseKanbanDataReturn, Pessoa, TarefaUnificada } from '@/types/kanban'

export function useKanbanData({ tipoVisao, equipeId }: UseKanbanDataProps): UseKanbanDataReturn {
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [tarefasPorPessoa, setTarefasPorPessoa] = useState<Record<string, TarefaUnificada[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchPessoas = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        tipo_visao: tipoVisao
      })

      if (tipoVisao === 'equipe' && equipeId) {
        params.append('equipe_id', equipeId)
      }

      const response = await fetch(`/api/kanban/pessoas?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar pessoas: ${response.statusText}`)
      }

      const data = await response.json()
      setPessoas(data.pessoas || [])
      
      return data.pessoas || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(errorMessage)
      setPessoas([])
      return []
    } finally {
      setIsLoading(false)
    }
  }, [tipoVisao, equipeId])

  const fetchTarefasPorPessoa = useCallback(async (pessoasData: Pessoa[]) => {
    if (pessoasData.length === 0) {
      setTarefasPorPessoa({})
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const pessoaIds = pessoasData.map(p => p.id).join(',')
      const response = await fetch(`/api/kanban/tarefas-por-pessoa?pessoa_ids=${pessoaIds}`)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar tarefas: ${response.statusText}`)
      }

      const data = await response.json()
      setTarefasPorPessoa(data.tarefas_por_pessoa || {})
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(errorMessage)
      setTarefasPorPessoa({})
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    const pessoasData = await fetchPessoas()
    await fetchTarefasPorPessoa(pessoasData)
  }, [fetchPessoas, fetchTarefasPorPessoa])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    pessoas,
    tarefasPorPessoa,
    isLoading,
    error,
    refetch
  }
}