import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server'

// PUT /api/projects/[id]/stages/reorder - Reorder stages
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { stages } = body

    // Validate input
    if (!Array.isArray(stages)) {
      return NextResponse.json(
        { error: 'Lista de estágios é obrigatória' },
        { status: 400 }
      )
    }

    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, team_id')
      .eq('id', id)
      .single()

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Projeto não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar projeto:', projectError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Check if user is owner or has write access
    let hasAccess = project.owner_id === user.id

    if (!hasAccess) {
      // Get user's team memberships
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)

      if (!teamError && teamMembers && project.team_id) {
        const userTeamIds = teamMembers.map(tm => tm.team_id)
        hasAccess = userTeamIds.includes(project.team_id)
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Update stage positions
    const updates = stages.map((stage: { id: string; position?: number; order_index?: number }) => ({
      id: stage.id,
      position: stage.order_index ?? stage.position // Map order_index to position
    }))

    // Use a transaction to update all stages at once
    // @ts-expect-error - Custom RPC function not in generated types
    const { error: updateError } = await supabase.rpc('update_stage_positions', {
      stage_updates: updates,
      project_uuid: id
    })

    if (updateError) {
      console.error('Erro ao atualizar posições dos estágios:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar posições dos estágios' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro na API de reordenação de estágios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}