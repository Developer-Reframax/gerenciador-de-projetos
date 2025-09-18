import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import type { ProjectDeviationWithUsers } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Verificar se o usuário tem acesso ao projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário é o proprietário ou membro da equipe
    const { data: collaborator } = await supabase
      .from('project_collaborators')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    const hasAccess = project.owner_id === user.id || collaborator

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado ao projeto' },
        { status: 403 }
      )
    }

    // Buscar desvios do projeto com informações dos usuários
    const { data: deviations, error: deviationsError } = await supabase
      .from('project_deviations')
      .select(`
        *,
        requested_by_user:users!project_deviations_requested_by_fkey(
          id,
          full_name,
          email,
          avatar_url
        ),
        approver_user:users!project_deviations_approver_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (deviationsError) {
      console.error('Erro ao buscar desvios:', deviationsError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Transformar os dados para o formato esperado
    const deviationsWithUsers: ProjectDeviationWithUsers[] = deviations.map((deviation) => ({
      id: deviation.id,
      project_id: deviation.project_id,
      description: deviation.description,
      was_requested: deviation.was_requested,
      requested_by: deviation.requested_by,
      evaluation_criteria: deviation.evaluation_criteria,
      impact_type: deviation.impact_type,
      requires_approval: deviation.requires_approval,
      approver_id: deviation.approver_id,
      status: deviation.status,
      approval_notes: deviation.approval_notes,
      created_at: deviation.created_at,
      approved_at: deviation.approved_at,
      updated_at: deviation.updated_at,
      requested_by_user: deviation.requested_by_user,
      approver_user: deviation.approver_user
    }))

    return NextResponse.json({ deviations: deviationsWithUsers })

  } catch (error) {
    console.error('Erro na rota de desvios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params
    const body = await request.json()

    // Verificar se o usuário tem acesso ao projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário é o proprietário ou membro da equipe
    const { data: collaborator } = await supabase
      .from('project_collaborators')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    const hasAccess = project.owner_id === user.id || collaborator

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado ao projeto' },
        { status: 403 }
      )
    }

    // Preparar dados do desvio
    const deviationData = {
      project_id: projectId,
      description: body.description,
      was_requested: body.was_requested || false,
      requested_by: body.was_requested ? body.requested_by : null,
      evaluation_criteria: body.evaluation_criteria,
      impact_type: body.impact_type,
      requires_approval: body.requires_approval || false,
      approver_id: body.requires_approval ? body.approver_id : null,
      status: 'Pendente',
      approval_notes: body.approval_notes || null
    }

    // Criar desvio
    const { data: deviation, error: deviationError } = await supabase
      .from('project_deviations')
      .insert(deviationData)
      .select()
      .single()

    if (deviationError) {
      console.error('Erro ao criar desvio:', deviationError)
      return NextResponse.json(
        { error: 'Erro ao criar desvio' },
        { status: 500 }
      )
    }

    // O status do projeto será atualizado automaticamente pelo trigger do banco

    return NextResponse.json({ deviation }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar desvio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}