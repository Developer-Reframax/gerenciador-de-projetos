import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Schema for impediment creation
const createImpedimentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  severity: z.enum(['baixa', 'media', 'alta', 'critica']).default('media'),
  task_id: z.string().uuid('ID da tarefa deve ser um UUID válido').optional()
})

// POST - Create a new impediment for a task in a stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id: workflowId, stageId } = await params
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
      .eq('id', workflowId)
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

    // Verify stage belongs to workflow
    const { error: stageError } = await supabase
      .from('workflow_stages')
      .select('id, workflow_id')
      .eq('id', stageId)
      .eq('workflow_id', workflowId)
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

    // Validate request body
    const body = await request.json()
    const validationResult = createImpedimentSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { task_id, title, description, severity } = validationResult.data

    // Verify task exists and belongs to the stage (only if task_id is provided)
    if (task_id) {
      const { error: taskError } = await supabase
        .from('workflow_tasks')
        .select('id, stage_id')
        .eq('id', task_id)
        .eq('stage_id', stageId)
        .single()

      if (taskError) {
        if (taskError.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Tarefa não encontrada nesta etapa' },
            { status: 404 }
          )
        }
        console.error('Erro ao buscar tarefa:', taskError)
        return NextResponse.json(
          { error: 'Erro interno do servidor' },
          { status: 500 }
        )
      }
    }

    // Create the impediment
    const impedimentData: {
      workflow_id: string;
      title: string;
      description?: string;
      severity: 'baixa' | 'media' | 'alta' | 'critica';
      status: 'aberto';
      reported_by: string;
      reported_date: string;
      task_id?: string;
    } = {
      workflow_id: workflowId,
      title,
      description,
      severity,
      status: 'aberto',
      reported_by: user.id,
      reported_date: new Date().toISOString().split('T')[0]
    }

    // Only include task_id if provided
    if (task_id) {
      impedimentData.task_id = task_id
    }

    const { data: impediment, error: createError } = await supabase
      .from('workflow_impediments')
      .insert([impedimentData])
      .select('*')
      .single()

    if (createError) {
      console.error('Erro ao criar impedimento:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar impedimento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ impediment }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de impedimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - List impediments for tasks in a stage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id: workflowId, stageId } = await params
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
      .eq('id', workflowId)
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

    // Get task IDs for this stage
    const { data: tasks, error: tasksError } = await supabase
      .from('workflow_tasks')
      .select('id')
      .eq('stage_id', stageId)

    if (tasksError) {
      console.error('Erro ao buscar tarefas:', tasksError)
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas' },
        { status: 500 }
      )
    }

    const taskIds = tasks?.map(task => task.id) || []

    // Get impediments for tasks in this stage
    const { data: impediments, error: impedimentsError } = await supabase
      .from('workflow_impediments')
      .select('*')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false })

    if (impedimentsError) {
      console.error('Erro ao buscar impedimentos:', impedimentsError)
      return NextResponse.json(
        { error: 'Erro ao buscar impedimentos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ impediments: impediments || [] })
  } catch (error) {
    console.error('Erro na API de impedimentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}