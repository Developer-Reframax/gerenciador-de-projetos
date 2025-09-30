import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET /api/workflows/[id]/logs - List all logs for a workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user || !user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verify user has access to this workflow
    const { error: workflowError } = await supabase
      .from('workflows')
      .select('id, created_by')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (workflowError) {
      if (workflowError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workflow não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar workflow:', workflowError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Get URL search params for filtering
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const table_name = searchParams.get('table_name')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('workflow_logs')
      .select(`
        id,
        workflow_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        user_id,
        created_at,
        user:users!workflow_logs_user_id_fkey(
          id,
          email,
          full_name
        )
      `)
      .eq('workflow_id', id)

    // Apply filters
    if (action) {
      query = query.eq('action', action)
    }
    if (table_name) {
      query = query.eq('table_name', table_name)
    }

    // Apply pagination and ordering
    const { data: logs, error: logsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (logsError) {
      console.error('Erro ao buscar logs:', logsError)
      return NextResponse.json(
        { error: 'Erro ao buscar logs' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('workflow_logs')
      .select('*', { count: 'exact', head: true })
      .eq('workflow_id', id)

    if (countError) {
      console.error('Erro ao contar logs:', countError)
    }

    return NextResponse.json({ 
      logs,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Erro na API de logs do workflow:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}