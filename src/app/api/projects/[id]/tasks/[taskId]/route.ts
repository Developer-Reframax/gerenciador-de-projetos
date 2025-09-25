import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET /api/projects/[id]/tasks/[taskId] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    const { id, taskId } = await params

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
      const { data: collaborator } = await supabase
      .from('project_collaborators')
        .select('id')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!collaborator
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Get the task with stage info
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        assignee_id,
        estimated_hours,
        position,
        stage_id,
        created_at,
        stage:stages!inner(id, name, project_id)
      `)
      .eq('id', taskId)
      .single()

    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tarefa não encontrada' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar tarefa:', taskError)
      return NextResponse.json(
        { error: 'Erro ao buscar tarefa' },
        { status: 500 }
      )
    }

    // Verify task belongs to the project
    if (task.stage.project_id !== id) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      task
    })

  } catch (error) {
    console.error('Erro na API de tarefa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id]/tasks/[taskId] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    const { id, taskId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, status, priority, assignee_id, estimated_hours, position } = body

    // Validate fields
    if (title !== undefined && (!title || !title.trim())) {
      return NextResponse.json(
        { error: 'Título da tarefa é obrigatório' },
        { status: 400 }
      )
    }

    if (status !== undefined) {
      const validStatuses = ['todo', 'in_progress', 'in_review', 'blocked', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido' },
          { status: 400 }
        )
      }
    }

    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'urgent']
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: 'Prioridade inválida' },
          { status: 400 }
        )
      }
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

    // Check if user has access to this project (owner or team member)
    let hasAccess = project.owner_id === user.id

    if (!hasAccess && project.team_id) {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', project.team_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!teamMember
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Verify task exists and belongs to project
    const { data: existingTask, error: existingTaskError } = await supabase
      .from('tasks')
      .select(`
        id,
        stage_id,
        stage:stages!inner(id, project_id)
      `)
      .eq('id', taskId)
      .single()

    if (existingTaskError) {
      if (existingTaskError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tarefa não encontrada' },
          { status: 404 }
        )
      }
      console.error('Erro ao verificar tarefa:', existingTaskError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (existingTask.stage.project_id !== id) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    // If assignee_id is being updated, verify the user exists and has access to the project
    if (assignee_id !== undefined && assignee_id !== null) {
      const { error: assignedUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', assignee_id)
        .single()

      if (assignedUserError) {
        return NextResponse.json(
          { error: 'Usuário atribuído não encontrado' },
          { status: 400 }
        )
      }

      // Check if assigned user has access to the project
      const isOwner = project.owner_id === assignee_id
      let isTeamMember = false

      if (!isOwner && project.team_id) {
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', project.team_id)
          .eq('user_id', assignee_id)
          .eq('status', 'active')
          .single()

        isTeamMember = !!teamMember
      }

      if (!isOwner && !isTeamMember) {
        return NextResponse.json(
          { error: 'Usuário atribuído não tem acesso ao projeto' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assignee_id !== undefined) updateData.assignee_id = assignee_id
    if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours
    if (position !== undefined) updateData.position = position

    // Update the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select(`
        id,
        title,
        description,
        status,
        priority,
        assignee_id,
        estimated_hours,
        position,
        stage_id,
        created_at
      `)
      .single()

    if (taskError) {
      console.error('Erro ao atualizar tarefa:', taskError)
      return NextResponse.json(
        { error: 'Erro ao atualizar tarefa' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      task
    })

  } catch (error) {
    console.error('Erro na API de atualização de tarefa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/tasks/[taskId] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    const { id, taskId } = await params

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

    if (!hasAccess && project.team_id) {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', project.team_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!teamMember
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Verify task exists and belongs to project
    const { data: existingTask, error: existingTaskError } = await supabase
      .from('tasks')
      .select(`
        id,
        stage_id,
        stage:stages!inner(id, project_id)
      `)
      .eq('id', taskId)
      .single()

    if (existingTaskError) {
      if (existingTaskError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tarefa não encontrada' },
          { status: 404 }
        )
      }
      console.error('Erro ao verificar tarefa:', existingTaskError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (existingTask.stage.project_id !== id) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    // Delete the task
    const { error: taskError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (taskError) {
      console.error('Erro ao excluir tarefa:', taskError)
      return NextResponse.json(
        { error: 'Erro ao excluir tarefa' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tarefa excluída com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de exclusão de tarefa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}