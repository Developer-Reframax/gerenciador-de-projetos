import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET /api/workflows/[id]/stages/[stageId]/tasks - List all tasks for a workflow stage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params
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
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('id, created_by')
      .eq('id', id)
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

    // Check if user is owner
    const hasAccess = workflow.created_by === user.id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Get tasks for this stage
    const { data: tasks, error: tasksError } = await supabase
      .from('workflow_tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
        position,
        stage_id,
        created_at
      `)
      .eq('stage_id', stageId)
      .eq('workflow_id', id)
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

// POST /api/workflows/[id]/stages/[stageId]/tasks - Create a new task
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
    const { title, description, priority, assigned_to, due_date } = body

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Título da tarefa é obrigatório' },
        { status: 400 }
      )
    }

    // Validate priority
    const validPriorities = ['baixa', 'media', 'alta', 'critica']
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Prioridade inválida' },
        { status: 400 }
      )
    }

    // Verify user has access to this workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('id, created_by')
      .eq('id', id)
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

    // Check if user is owner with write access
    const hasAccess = workflow.created_by === user.id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Verify stage exists and belongs to workflow
    const { error: stageError } = await supabase
      .from('workflow_stages')
      .select('id, workflow_id')
      .eq('id', stageId)
      .eq('workflow_id', id)
      .single()

    if (stageError) {
      if (stageError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Etapa não encontrada' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar etapa:', stageError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // If assigned_to is provided, verify the user exists
    if (assigned_to) {
      const { error: assignedUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', assigned_to)
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
      .from('workflow_tasks')
      .select('position')
      .eq('stage_id', stageId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = lastTask && lastTask.position !== null ? lastTask.position + 1 : 0

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from('workflow_tasks')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        status: 'pendente',
        priority: priority || 'media',
        assigned_to: assigned_to || null,
        due_date: due_date || null,
        position: nextPosition,
        stage_id: stageId,
        created_by: user.id,
        workflow_id: id
      })
      .select(`
        id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
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