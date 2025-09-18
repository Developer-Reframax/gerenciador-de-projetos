import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deviationId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, deviationId } = await params
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

    // Buscar desvio atual
    const { data: currentDeviation, error: currentDeviationError } = await supabase
      .from('project_deviations')
      .select('*')
      .eq('id', deviationId)
      .eq('project_id', projectId)
      .single()

    if (currentDeviationError || !currentDeviation) {
      return NextResponse.json(
        { error: 'Desvio não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados de atualização
    const updateData: {
      description: string;
      was_requested: boolean;
      requested_by: string | null;
      evaluation_criteria: string;
      impact_type: string;
      requires_approval: boolean;
      approver_id: string | null;
      approval_notes: string | null;
      updated_at: string;
      status?: string;
      approved_at?: string;
      approved_by?: string;
    } = {
      description: body.description,
      was_requested: body.was_requested || false,
      requested_by: body.was_requested ? body.requested_by : null,
      evaluation_criteria: body.evaluation_criteria,
      impact_type: body.impact_type,
      requires_approval: body.requires_approval || false,
      approver_id: body.requires_approval ? body.approver_id : null,
      approval_notes: body.approval_notes || null,
      updated_at: new Date().toISOString()
    }

    // Se o status foi alterado, incluir campos relacionados
    if (body.status) {
      updateData.status = body.status
      
      if (body.status === 'Aprovado') {
        updateData.approved_at = body.approved_at || new Date().toISOString()
        updateData.approved_by = body.approved_by || user.id
      }
    }

    // Atualizar desvio
    const { data: deviation, error: deviationError } = await supabase
      .from('project_deviations')
      .update(updateData)
      .eq('id', deviationId)
      .eq('project_id', projectId)
      .select()
      .single()

    if (deviationError) {
      console.error('Erro ao atualizar desvio:', deviationError)
      return NextResponse.json(
        { error: 'Erro ao atualizar desvio' },
        { status: 500 }
      )
    }



    return NextResponse.json({ deviation })

  } catch (error) {
    console.error('Erro ao atualizar desvio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deviationId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, deviationId } = await params

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

    // Verificar se o desvio existe
    const { data: deviation, error: deviationError } = await supabase
      .from('project_deviations')
      .select('id')
      .eq('id', deviationId)
      .eq('project_id', projectId)
      .single()

    if (deviationError || !deviation) {
      return NextResponse.json(
        { error: 'Desvio não encontrado' },
        { status: 404 }
      )
    }

    // Deletar o desvio
    const { error: deleteError } = await supabase
      .from('project_deviations')
      .delete()
      .eq('id', deviationId)
      .eq('project_id', projectId)

    if (deleteError) {
      console.error('Erro ao deletar desvio:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar desvio' },
        { status: 500 }
      )
    }



    return NextResponse.json({ message: 'Desvio deletado com sucesso' })

  } catch (error) {
    console.error('Erro ao deletar desvio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}