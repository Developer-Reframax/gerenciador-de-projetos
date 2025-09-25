import { supabase } from './supabase-client'

class ApiClient {
  private sessionCache: { session: { access_token?: string } | null; timestamp: number } | null = null
  private readonly CACHE_DURATION = 30000 // 30 segundos
  private readonly baseURL = '/api'
  
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
    options: RequestInit = {},
    isFormData: boolean = false
  ): Promise<T> {
    const headers = await this.getAuthHeaders()
    const fullUrl = url.startsWith('/api') ? url : `${this.baseURL}${url}`
    
    // Para FormData, não definir Content-Type para permitir boundary automático
    const requestHeaders = isFormData 
      ? { Authorization: (headers as Record<string, string>)['Authorization'] }
      : headers
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...requestHeaders,
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

  async post<T = unknown>(url: string, data?: Record<string, unknown> | FormData): Promise<T> {
    const isFormData = data instanceof FormData
    return this.request<T>(url, {
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    }, isFormData)
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
