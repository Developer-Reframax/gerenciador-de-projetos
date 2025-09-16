import { createMiddlewareClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que requerem autenticação
const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/teams',
  '/users',
  '/kanban',
  '/gantt',
  '/documents',
  '/tasks',
  '/profile',
  '/settings'
]

// Rotas de autenticação (redirecionam usuários logados)
const authRoutes = ['/login', '/signup', '/register', '/forgot-password', '/reset-password']

// Rotas públicas que não requerem autenticação

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Criar cliente Supabase para middleware
  const { supabase, response } = createMiddlewareClient(request)
  
  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  const isAuthenticated = !!session
  
  // Verificar se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Verificar se a rota atual é de autenticação
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Redirecionar usuários não autenticados de rotas protegidas
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Redirecionar usuários autenticados de rotas de autenticação
  if (isAuthRoute && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    const redirectUrl = new URL(redirectTo || '/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Redirecionar da página inicial para o dashboard se autenticado
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Permitir acesso a todas as outras rotas
  return response
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Processar todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (favicon)
     * - arquivos públicos (extensões comuns)
     * - rotas da API (/api/*)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}