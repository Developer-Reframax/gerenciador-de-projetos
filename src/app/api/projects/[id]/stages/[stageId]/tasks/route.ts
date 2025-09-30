import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET /api/projects/[id]/stages/[stageId]/tasks - List all tasks for a stage
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

    // Verify stage exists and belongs to project
    const { error: stageError } = await supabase
      .from('stages')
      .select('id, project_id')
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
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Get tasks for this stage
    const { data: tasks, error: tasksError } = await supabase
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
        created_at
      `)
      .eq('stage_id', stageId)
      .order('position', { ascending: true })

    if (tasksError) {
      console.error('Erro ao buscar tarefas:', tasksError)
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tasks: tasks || []
    })

  } catch (error) {
    console.error('Erro na API de tarefas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/stages/[stageId]/tasks - Create a new task
export async function POST(
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
    const { title, description, priority, assignee_id, estimated_hours } = body

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Título da tarefa é obrigatório' },
        { status: 400 }
      )
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high']
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Prioridade inválida' },
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
    const { error: stageError } = await supabase
      .from('stages')
      .select('id, project_id')
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
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // If assignee_id is provided, verify the user exists
    if (assignee_id) {
      // Check if user exists
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
    }

    // Get the last task position in this stage
    const { data: lastTask } = await supabase
      .from('tasks')
      .select('position')
      .eq('stage_id', stageId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = lastTask && lastTask.position !== null ? lastTask.position + 1 : 0

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        status: 'todo',
        priority: priority || 'important',
        assignee_id: assignee_id || null,
        estimated_hours: estimated_hours || null,
        position: nextPosition,
        stage_id: stageId,
        reporter_id: user.id,
        project_id: id
      })
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
      console.error('Erro ao criar tarefa:', taskError)
      return NextResponse.json(
        { error: 'Erro ao criar tarefa' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      task
    }, { status: 201 })

  } catch (error) {
    console.error('Erro na API de criação de tarefa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}