'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'
import type { ProjectLog, ProjectLogFilters } from '@/types'

// Interface para resposta da API de logs
interface ProjectLogsResponse {
  logs: ProjectLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function useProjectLogs(projectId: string, filters?: ProjectLogFilters) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<ProjectLog[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    if (!user || !projectId) return

    try {
      setLoading(true)
      setError(null)

      // Construir query params para filtros
      const params = new URLSearchParams()
      
      if (filters?.page) {
        params.append('page', filters.page.toString())
      }
      
      if (filters?.limit) {
        params.append('limit', filters.limit.toString())
      }
      
      if (filters?.action_type) {
        params.append('action_type', filters.action_type)
      }
      
      if (filters?.table_name) {
        params.append('table_name', filters.table_name)
      }
      
      if (filters?.user_id) {
        params.append('user_id', filters.user_id)
      }
      
      if (filters?.start_date) {
        params.append('start_date', filters.start_date)
      }
      
      if (filters?.end_date) {
        params.append('end_date', filters.end_date)
      }
      
      if (filters?.search) {
        params.append('search', filters.search)
      }

      const url = `/api/projects/${projectId}/logs${params.toString() ? `?${params.toString()}` : ''}`
      const data = await apiClient.get<ProjectLogsResponse>(url)
      
      setLogs(data.logs || [])
      setPagination(data.pagination)
    } catch (err) {
      console.error('Erro ao buscar logs do projeto:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      
      // Se for erro 403, não tentar novamente automaticamente
      if (err instanceof Error && err.message.includes('403')) {
        console.warn('Acesso negado aos logs do projeto. Verifique suas permissões.')
      }
    } finally {
      setLoading(false)
    }
  }, [user, projectId, filters])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return {
    logs,
    pagination,
    loading,
    error,
    refetch: fetchLogs
  }
}

// Hook para gerenciar filtros de logs
export function useProjectLogsFilters(initialFilters?: Partial<ProjectLogFilters>) {
  const [filters, setFilters] = useState<ProjectLogFilters>({
    page: 1,
    limit: 20,
    ...initialFilters
  })

  const updateFilter = useCallback((key: keyof ProjectLogFilters, value: ProjectLogFilters[keyof ProjectLogFilters]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset page when changing filters (except page itself)
      ...(key !== 'page' ? { page: 1 } : {})
    }))
  }, [])

  const updateFilters = useCallback((newFilters: Partial<ProjectLogFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Reset page when changing multiple filters
      page: newFilters.page || 1
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 20,
      ...initialFilters
    })
  }, [initialFilters])

  const nextPage = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      page: (prev.page || 1) + 1
    }))
  }, [])

  const prevPage = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      page: Math.max(1, (prev.page || 1) - 1)
    }))
  }, [])

  const goToPage = useCallback((page: number) => {
    setFilters(prev => ({
      ...prev,
      page: Math.max(1, page)
    }))
  }, [])

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    nextPage,
    prevPage,
    goToPage
  }
}

// Hook para obter opções de filtros (tabelas, usuários, etc.)
export function useProjectLogsFilterOptions(projectId: string) {
  const { user } = useAuth()
  
  // Lista estática de tabelas disponíveis para filtros
  const tables = [
    'projects',
    'stages', 
    'tasks',
    'risks',
    'impediments',
    'project_deviations',
    'comments',
    'attachments'
  ]
  
  const [users, setUsers] = useState<Array<{ id: string; email: string; full_name?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFilterOptions = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar membros do projeto
      const usersResponse = await apiClient.get<{ id: string; email: string; full_name?: string }[]>(
        `/api/projects/${projectId}/members`
      )
      
      // Extrair usuários dos membros
      const projectUsers = usersResponse || []
      setUsers(projectUsers)
    } catch (err) {
      console.error('Erro ao buscar usuários do projeto:', err)
      // Em caso de erro, continuar sem usuários para filtro
      setUsers([])
      setError(null) // Não mostrar erro para não quebrar a interface
    } finally {
      setLoading(false)
    }
  }, [user, projectId])

  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  return {
    tables,
    users,
    loading,
    error,
    refetch: fetchFilterOptions
  }
}