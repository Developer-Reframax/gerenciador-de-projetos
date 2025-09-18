import { useState, useEffect, useCallback } from 'react'
import { Project } from '@/types/project'
import { toast } from 'sonner'

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar projeto')
      }
      
      setProject(data.project)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [projectId])

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
