import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Schema para validação dos filtros
const logsFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  action_type: z.enum(['INSERT', 'UPDATE', 'DELETE']).optional(),
  table_name: z.string().optional(),
  user_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  search: z.string().optional()
})

// GET - Listar logs do projeto com paginação e filtros
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  
  try {
    const supabase = createRouteHandlerClient(await cookies())

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o projeto existe e o usuário tem acesso (via RLS)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado ou acesso negado' },
        { status: 403 }
      )
    }

    // Extrair e validar parâmetros de query
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const filters = logsFiltersSchema.parse(queryParams)

    // Construir query base (sem join com users para evitar PGRST200)
    let query = supabase
      .from('project_logs')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId)

    // Aplicar filtros
    if (filters.action_type) {
      query = query.eq('action_type', filters.action_type)
    }

    if (filters.table_name) {
      query = query.eq('table_name', filters.table_name)
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date)
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date)
    }

    if (filters.search) {
      query = query.or(`description.ilike.%${filters.search}%,table_name.ilike.%${filters.search}%`)
    }

    // Aplicar paginação e ordenação
    const offset = (filters.page - 1) * filters.limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + filters.limit - 1)

    const { data: logs, error: logsError, count } = await query

    if (logsError) {
      console.error('Erro ao buscar logs:', logsError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Buscar informações dos usuários separadamente
    let logsWithUsers = logs || []
    if (logs && logs.length > 0) {
      const userIds = [...new Set(logs.map(log => log.user_id).filter((id): id is string => Boolean(id)))]
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds)
      
      if (usersError) {
        console.error('Erro ao buscar usuários:', usersError)
      }
      
      // Mapear usuários para os logs
      logsWithUsers = logs.map(log => ({
        ...log,
        user: users?.find(user => user.id === log.user_id) || {
          id: log.user_id,
          email: 'Usuário não encontrado',
          full_name: 'Usuário não encontrado',
          avatar_url: null
        }
      }))
    }

    // Calcular informações de paginação
    const totalPages = Math.ceil((count || 0) / filters.limit)

    return NextResponse.json({
      logs: logsWithUsers,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro na API de logs:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}