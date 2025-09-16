'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Se o usuário está autenticado, redireciona para o dashboard
        router.push('/dashboard')
      } else {
        // Se o usuário não está autenticado, redireciona para o login
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // Mostrar loading enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Esta página não deve ser renderizada, pois sempre redireciona
  return null
}
