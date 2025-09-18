import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RequestCookies } from 'next/dist/server/web/spec-extension/cookies'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

// Configuração do cliente Supabase para Server Components
export async function createServerComponentClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignorar erros de cookies em Server Components
            // Eles serão tratados no middleware ou Route Handlers
          }
        },
      },
    }
  )
}

// Configuração do cliente Supabase para Route Handlers
export function createRouteHandlerClient(cookieStore: RequestCookies | ReadonlyRequestCookies): SupabaseClient<Database> {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if ('set' in cookieStore) {
                cookieStore.set(name, value, options)
              }
            })
          } catch {
            // Ignorar erros de cookies em Route Handlers
          }
        },
      },
    }
  )
}

// Configuração do cliente Supabase para Middleware
export function createMiddlewareClient(request: NextRequest): { supabase: SupabaseClient<Database>, response: NextResponse } {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response }
}

// Configuração do cliente Supabase com Service Role para operações administrativas
export function createServiceRoleClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
