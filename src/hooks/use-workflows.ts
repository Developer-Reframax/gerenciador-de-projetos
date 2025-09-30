'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'
import type { 
  Workflow, 
  CreateWorkflowData, 
  UpdateWorkflowData, 
  WorkflowFilters,
  WorkflowStats
} from '@/types/workflow'

// Interfaces para respostas da API
interface WorkflowsResponse {
  workflows: Workflow[]
}

interface WorkflowResponse {
  workflow: Workflow
}

export function useWorkflows(filters?: WorkflowFilters) {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkflows = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Construir query params para filtros
      const params = new URLSearchParams()
      if (filters?.status?.length) {
        filters.status.forEach(status => params.append('status', status))
      }
      if (filters?.category?.length) {
        filters.category.forEach(category => params.append('category', category))
      }
      if (filters?.priority?.length) {
        filters.priority.forEach(priority => params.append('priority', priority))
      }
      if (filters?.search) {
        params.append('search', filters.search)
      }

      const url = `/api/workflows${params.toString() ? `?${params.toString()}` : ''}`
      const data = await apiClient.get<WorkflowsResponse>(url)
      setWorkflows(data.workflows || [])
    } catch (err) {
      console.error('Erro ao buscar workflows:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [user, filters?.status, filters?.category, filters?.priority, filters?.search])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  return {
    workflows,
    loading,
    error,
    refetch: fetchWorkflows
  }
}

export function useWorkflow(id: string) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkflow = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const data = await apiClient.get<WorkflowResponse>(`/api/workflows/${id}`)
      setWorkflow(data.workflow)
    } catch (err) {
      console.error('Erro ao buscar workflow:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchWorkflow()
  }, [fetchWorkflow])

  return {
    workflow,
    loading,
    error,
    refetch: fetchWorkflow
  }
}

export function useWorkflowMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createWorkflow = async (data: CreateWorkflowData): Promise<Workflow> => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiClient.post<WorkflowResponse>('/api/workflows', data as unknown as Record<string, unknown>)
      return result.workflow
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateWorkflow = async (id: string, data: UpdateWorkflowData): Promise<Workflow> => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiClient.put<WorkflowResponse>(`/api/workflows/${id}`, data as unknown as Record<string, unknown>)
      return result.workflow
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteWorkflow = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      await apiClient.delete(`/api/workflows/${id}`)
      
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
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    loading,
    error
  }
}

export function useWorkflowStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<WorkflowStats>({
    total: 0,
    by_status: {
      planejamento: 0,
      em_andamento: 0,
      concluido: 0,
      cancelado: 0
    },
    by_category: {
      iniciativa: 0,
      melhoria: 0
    },
    by_priority: {
      baixa: 0,
      media: 0,
      alta: 0,
      critica: 0
    },
    completion_rate: 0,
    total_tasks: 0,
    completed_tasks: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/workflows/stats')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas')
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}