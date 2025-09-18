"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface UserData {
  full_name?: string
  avatar_url?: string
  [key: string]: unknown
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>
  signUp: (email: string, password: string, userData?: UserData) => Promise<{ error: AuthError | Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    
    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        // Primeiro obter a sessão para ter o token
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        setSession(session)
        
        // Só validar usuário se houver sessão
        if (session?.user) {
          // Usar o usuário da sessão se disponível para evitar chamada extra
          setUser(session.user)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Erro ao obter sessão inicial:', error)
        if (mounted) {
          setUser(null)
          setSession(null)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        setSession(session)
        
        // Usar o usuário da sessão diretamente para evitar chamadas extras
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        
        setLoading(false)

        // Redirecionar apenas quando necessário
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )
    
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Erro no login:', error)
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Erro inesperado no login:', error)
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData?: UserData) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      })
      
      if (error) {
        console.error('Erro no cadastro:', error)
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Erro inesperado no cadastro:', error)
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Erro no logout:', error)
      }
    } catch (error) {
      console.error('Erro inesperado no logout:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        console.error('Erro ao resetar senha:', error)
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Erro inesperado ao resetar senha:', error)
      return { error: error as Error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

// Hook para proteger rotas
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  return { user, loading }
}
