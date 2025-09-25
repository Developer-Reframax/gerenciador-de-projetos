'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'

interface ProjectMember {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  role: string
}

// Cache simples para evitar chamadas duplicadas
const membersCache = new Map<string, { data: ProjectMember[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function useProjectMembers(projectId: string) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    // Verificar cache
    const cached = membersCache.get(projectId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setMembers(cached.data)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`)
      
      if (response && Array.isArray(response)) {
        setMembers(response)
        // Atualizar cache
        membersCache.set(projectId, {
          data: response,
          timestamp: Date.now()
        })
      } else {
        setMembers([])
      }
    } catch (err) {
      console.error('Error fetching project members:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar membros do projeto')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    console.log('[useProjectMembers] Hook called with projectId:', projectId);
    
    if (!projectId) {
      console.log('[useProjectMembers] No projectId provided');
      return;
    }

    // Check cache first
    const cached = membersCache.get(projectId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[useProjectMembers] Using cached data:', cached.data);
      setMembers(cached.data);
      setLoading(false);
      return;
    }

    const fetchMembersWithLogging = async () => {
      try {
        console.log('[useProjectMembers] Starting fetch for projectId:', projectId);
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`);
        console.log('[useProjectMembers] API response:', response);
        
        if (response && Array.isArray(response)) {
          console.log('[useProjectMembers] Fetched members data:', response);
          setMembers(response);
          // Update cache
          membersCache.set(projectId, {
            data: response,
            timestamp: Date.now()
          });
          console.log('[useProjectMembers] Data cached for projectId:', projectId);
        } else {
          setMembers([]);
        }
      } catch (err) {
        console.error('[useProjectMembers] Error fetching members:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar membros do projeto');
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembersWithLogging();
  }, [projectId])

  return {
    members,
    loading,
    error,
    refetch: fetchMembers
  }
}