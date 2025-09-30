import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

interface TaskUpdateData {
  title?: string
  description?: string | null
  status?: string
  priority?: string
  assigned_to?: string | null
  due_date?: string | null
}

// PUT /api/workflows/[id]/tasks/[taskId] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params
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
    const { title, description, status, priority, assigned_to, due_date } = body

    // Validate required fields
    if (title !== undefined && (!title || !title.trim())) {
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

    // Validate status
    const validStatuses = ['pendente', 'em_andamento', 'concluida', 'cancelada']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
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

    // Verify task exists and belongs to workflow
    const { error: taskError } = await supabase
      .from('workflow_tasks')
      .select('id, workflow_id, stage_id')
      .eq('id', taskId)
      .eq('workflow_id', id)
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

    // Prepare update data - only include fields that are provided
    const updateData: TaskUpdateData = {}
    
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null
    if (due_date !== undefined) updateData.due_date = due_date || null

    // Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from('workflow_tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('workflow_id', id)
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
        created_at,
        updated_at
      `)
      .single()

    if (updateError) {
      console.error('Erro ao atualizar tarefa:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar tarefa' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      task: updatedTask
    })

  } catch (error) {
    console.error('Erro na API de atualização de tarefa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET /api/workflows/[id]/tasks/[taskId] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params
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

    // Get the task
    const { data: task, error: taskError } = await supabase
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
        created_at,
        updated_at
      `)
      .eq('id', taskId)
      .eq('workflow_id', id)
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

// DELETE /api/workflows/[id]/tasks/[taskId] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params
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

    // Verify task exists and belongs to workflow
    const { error: taskError } = await supabase
      .from('workflow_tasks')
      .select('id, workflow_id')
      .eq('id', taskId)
      .eq('workflow_id', id)
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
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Delete the task
    const { error: deleteError } = await supabase
      .from('workflow_tasks')
      .delete()
      .eq('id', taskId)
      .eq('workflow_id', id)

    if (deleteError) {
      console.error('Erro ao deletar tarefa:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar tarefa' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Tarefa deletada com sucesso' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro na API de deleção de tarefa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}