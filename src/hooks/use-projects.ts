'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'
import type { 
  Project, 
  CreateProjectData, 
  UpdateProjectData, 
  ProjectFilters,
  ProjectStats
} from '@/types/project'

// Interfaces para respostas da API
interface ProjectsResponse {
  projects: Project[]
}

interface ProjectResponse {
  project: Project
}

export function useProjects(filters?: ProjectFilters) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Construir query params para filtros
      const params = new URLSearchParams()
      if (filters?.status?.length) {
        filters.status.forEach(status => params.append('status', status))
      }
      if (filters?.priority?.length) {
        filters.priority.forEach(priority => params.append('priority', priority))
      }
      if (filters?.team_id) {
        params.append('team_id', filters.team_id)
      }
      if (filters?.owner_id) {
        params.append('owner_id', filters.owner_id)
      }
      if (filters?.search) {
        params.append('search', filters.search)
      }

      const url = `/api/projects${params.toString() ? `?${params.toString()}` : ''}`
      const data = await apiClient.get<ProjectsResponse>(url)
      setProjects(data.projects || [])
    } catch (err) {
      console.error('Erro ao buscar projetos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [user, filters])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects
  }
}

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const data = await apiClient.get<ProjectResponse>(`/api/projects/${id}`)
      setProject(data.project)
    } catch (err) {
      console.error('Erro ao buscar projeto:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  return {
    project,
    loading,
    error,
    refetch: fetchProject
  }
}

export function useProjectMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProject = async (data: CreateProjectData): Promise<Project> => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiClient.post<ProjectResponse>('/api/projects', data as unknown as Record<string, unknown>)
      return result.project
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (id: string, data: UpdateProjectData): Promise<Project> => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiClient.put<ProjectResponse>(`/api/projects/${id}`, data as unknown as Record<string, unknown>)
      return result.project
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      await apiClient.delete(`/api/projects/${id}`)
      
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
    createProject,
    updateProject,
    deleteProject,
    loading,
    error
  }
}

export function useProjectStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    completed: 0,
    active: 0,
    planning: 0,
    on_hold: 0,
    cancelled: 0,
    completion_rate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/projects/stats')
      
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

// Hook para buscar usuários (para o select de solicitante)
export function useUsers() {
  const [users, setUsers] = useState<Array<{
    id: string
    email: string
    full_name: string | null
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/users')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar usuários')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Erro ao buscar usuários:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  }
}

// Hook para buscar equipes do usuário
export function useUserTeams() {
  const [teams, setTeams] = useState<Array<{
    id: string
    name: string
    description: string | null
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/teams')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar equipes')
      }

      const data = await response.json()
      setTeams(data.teams || [])
    } catch (err) {
      console.error('Erro ao buscar equipes:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams
  }
}
