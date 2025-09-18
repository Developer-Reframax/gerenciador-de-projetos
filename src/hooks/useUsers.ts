'use client'

import { useState, useEffect } from 'react'
import { User, CreateUserForm, UpdateUserForm, UserFilters, UserStats } from '@/types/user'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async (filters?: UserFilters) => {
    try {
      setLoading(true)
      setError(null)

      // Construir URL com parâmetros de filtro
      const searchParams = new URLSearchParams()
      if (filters?.search) {
        searchParams.append('search', filters.search)
      }
      if (filters?.role && filters.role !== 'all') {
        searchParams.append('role', filters.role)
      }
      if (filters?.status && filters.status !== 'all') {
        searchParams.append('status', filters.status)
      }

      const url = `/api/users${searchParams.toString() ? '?' + searchParams.toString() : ''}`
      
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Erro ao buscar usuários')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar usuários'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: CreateUserForm) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário')
      }
      
      toast.success('Usuário criado com sucesso! Credenciais enviadas por email.')
      
      // Recarregar lista de usuários
      await fetchUsers()
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar usuário'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId: string, userData: UpdateUserForm) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar usuário')
      }

      // Atualizar estado local
      if (result.user) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, ...result.user } : user
        ))
      }

      toast.success('Usuário atualizado com sucesso!')
      return result.user
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar usuário'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir usuário')
      }

      // Remover do estado local
      setUsers(prev => prev.filter(user => user.id !== userId))

      toast.success('Usuário removido com sucesso!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover usuário'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await updateUser(userId, { is_active: isActive })
      toast.success(`Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`)
    } catch {
      // Erro já tratado no updateUser
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    refetch: fetchUsers
  }
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get('/api/users') as { data: Array<{ role: 'admin' | 'editor' | 'membro' | 'user'; is_active: boolean }> }
      const users = response.data

      const stats: UserStats = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        inactive: users.filter(u => !u.is_active).length,
        by_role: {
          admin: users.filter(u => u.role === 'admin').length,
          editor: users.filter(u => u.role === 'editor').length,
          membro: users.filter(u => u.role === 'membro').length,
          user: users.filter(u => u.role === 'user').length,
        }
      }

      setStats(stats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}
