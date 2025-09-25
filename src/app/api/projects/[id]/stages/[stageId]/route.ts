import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET /api/projects/[id]/stages/[stageId] - Get a specific stage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params
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

    // Check if user is owner or team member
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

    // Get the stage with its tasks
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select(`
        id,
        name,
        position,
        project_id,
        created_at,
        tasks (
          id,
          title,
          description,
          status,
          priority,
          assignee_id,
          position,
          stage_id,
          created_at
        )
      `)
      .eq('id', stageId)
      .eq('project_id', id)
      .single()

    if (stageError) {
      if (stageError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Estágio não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar estágio:', stageError)
      return NextResponse.json(
        { error: 'Erro ao buscar estágio' },
        { status: 500 }
      )
    }

    // Sort tasks by position
    const sortedTasks = stage.tasks ? stage.tasks.sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0)) : []
    
    const stageWithSortedTasks = {
      id: stage.id,
      name: stage.name,
      position: stage.position,
      order_index: stage.position, // Map position to order_index for frontend compatibility
      project_id: stage.project_id,
      created_at: stage.created_at,
      tasks: sortedTasks
    }

    return NextResponse.json({
      stage: stageWithSortedTasks
    })

  } catch (error) {
    console.error('Erro na API de estágio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id]/stages/[stageId] - Update a stage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params
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
    const { name, description, color, position, order_index } = body

    // Validate required fields
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json(
        { error: 'Nome do estágio é obrigatório' },
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

    // Check if user is owner or team member with write access
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

    // Verify stage exists and belongs to project
    const { error: existingStageError } = await supabase
      .from('stages')
      .select('id, project_id')
      .eq('id', stageId)
      .eq('project_id', id)
      .single()

    if (existingStageError) {
      if (existingStageError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Estágio não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao verificar estágio:', existingStageError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color
    if (position !== undefined) updateData.position = position
    if (order_index !== undefined) updateData.position = order_index // Map order_index to position

    // Update the stage
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .update(updateData)
      .eq('id', stageId)
      .select()
      .single()

    if (stageError) {
      console.error('Erro ao atualizar estágio:', stageError)
      return NextResponse.json(
        { error: 'Erro ao atualizar estágio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      stage: {
        ...stage,
        order_index: stage.position // Map position to order_index for frontend compatibility
      }
    })

  } catch (error) {
    console.error('Erro na API de atualização de estágio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/stages/[stageId] - Delete a stage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params
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

    // Check if user is owner or team member with admin access
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

    // Verify stage exists and belongs to project
    const { error: existingStageError } = await supabase
      .from('stages')
      .select('id, project_id')
      .eq('id', stageId)
      .eq('project_id', id)
      .single()

    if (existingStageError) {
      if (existingStageError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Estágio não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao verificar estágio:', existingStageError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Delete all tasks in this stage first (cascade should handle this, but being explicit)
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('stage_id', stageId)

    if (tasksError) {
      console.error('Erro ao excluir tarefas do estágio:', tasksError)
      return NextResponse.json(
        { error: 'Erro ao excluir tarefas do estágio' },
        { status: 500 }
      )
    }

    // Delete the stage
    const { error: stageError } = await supabase
      .from('stages')
      .delete()
      .eq('id', stageId)

    if (stageError) {
      console.error('Erro ao excluir estágio:', stageError)
      return NextResponse.json(
        { error: 'Erro ao excluir estágio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Estágio excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de exclusão de estágio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}