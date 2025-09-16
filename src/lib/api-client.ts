import { supabase } from './supabase-client'

class ApiClient {
  private sessionCache: { session: { access_token?: string } | null; timestamp: number } | null = null
  private readonly CACHE_DURATION = 30000 // 30 segundos
  
  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    try {
      // Verificar cache primeiro
      const now = Date.now()
      if (this.sessionCache && (now - this.sessionCache.timestamp) < this.CACHE_DURATION) {
        if (this.sessionCache.session?.access_token) {
          headers['Authorization'] = `Bearer ${this.sessionCache.session.access_token}`
        }
        return headers
      }
      
      // Obter sessão apenas uma vez
      const { data: { session } } = await supabase.auth.getSession()
      
      // Atualizar cache
      this.sessionCache = {
        session,
        timestamp: now
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
    } catch (error) {
      console.error('Erro ao obter headers de autenticação:', error)
      // Limpar cache em caso de erro
      this.sessionCache = null
    }
    
    return headers
  }

  async request<T = unknown>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async get<T = unknown>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T = unknown>(url: string, data?: Record<string, unknown>): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = unknown>(url: string, data?: Record<string, unknown>): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = unknown>(url: string, data?: Record<string, unknown>): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = unknown>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()