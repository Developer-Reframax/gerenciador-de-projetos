'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { WorkflowLog } from '@/types/workflow'

// Interfaces para respostas da API
interface WorkflowLogsResponse {
  logs: WorkflowLog[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface WorkflowLogsFilters {
  action?: string
  table_name?: string
  limit?: number
  offset?: number
}

export function useWorkflowLogs(workflowId: string, filters?: WorkflowLogsFilters) {
  const [logs, setLogs] = useState<WorkflowLog[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async (append = false) => {
    if (!workflowId) return

    try {
      setLoading(true)
      setError(null)

      // Construir query params para filtros
      const params = new URLSearchParams()
      if (filters?.action) {
        params.append('action', filters.action)
      }
      if (filters?.table_name) {
        params.append('table_name', filters.table_name)
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString())
      }
      if (filters?.offset) {
        params.append('offset', filters.offset.toString())
      }

      const url = `/api/workflows/${workflowId}/logs${params.toString() ? `?${params.toString()}` : ''}`
      const data = await apiClient.get<WorkflowLogsResponse>(url)
      
      if (append) {
        setLogs(prev => [...prev, ...(data.logs || [])])
      } else {
        setLogs(data.logs || [])
      }
      
      setPagination(data.pagination)
    } catch (err) {
      console.error('Erro ao buscar logs do workflow:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [workflowId, filters])

  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || loading) return

    const newFilters = {
      ...filters,
      offset: pagination.offset + pagination.limit
    }

    try {
      setLoading(true)
      setError(null)

      // Construir query params para filtros
      const params = new URLSearchParams()
      if (newFilters?.action) {
        params.append('action', newFilters.action)
      }
      if (newFilters?.table_name) {
        params.append('table_name', newFilters.table_name)
      }
      if (newFilters?.limit) {
        params.append('limit', newFilters.limit.toString())
      }
      if (newFilters?.offset) {
        params.append('offset', newFilters.offset.toString())
      }

      const url = `/api/workflows/${workflowId}/logs${params.toString() ? `?${params.toString()}` : ''}`
      const data = await apiClient.get<WorkflowLogsResponse>(url)
      
      setLogs(prev => [...prev, ...(data.logs || [])])
      setPagination(data.pagination)
    } catch (err) {
      console.error('Erro ao carregar mais logs:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [workflowId, filters, pagination, loading])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return {
    logs,
    pagination,
    loading,
    error,
    refetch: () => fetchLogs(false),
    loadMore
  }
}

// Hook para buscar logs com filtros específicos
export function useWorkflowLogsByAction(workflowId: string, action: string) {
  return useWorkflowLogs(workflowId, { action })
}

export function useWorkflowLogsByTable(workflowId: string, tableName: string) {
  return useWorkflowLogs(workflowId, { table_name: tableName })
}