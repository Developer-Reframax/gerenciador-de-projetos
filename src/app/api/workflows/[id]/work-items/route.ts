import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { createWorkflowStageSchema } from '@/types/workflow'
import { cookies } from 'next/headers'

// GET /api/workflows/[id]/work-items - List all stages for a workflow
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

    // Get stages with their tasks and impediments
    const { data: stages, error: stagesError } = await supabase
      .from('workflow_stages')
      .select(`
        id,
        name,
        description,
        position,
        workflow_id,
        created_at,
        workflow_tasks (
          id,
          title,
          description,
          status,
          priority,
          assigned_to,
          position,
          stage_id,
          created_at
        )
      `)
      .eq('workflow_id', id)
      .order('position', { ascending: true })

    // Get task IDs for impediments query
    const taskIds: string[] = []
    stages?.forEach(stage => {
      const stageTasks = stage.workflow_tasks as { id: string }[] || []
      stageTasks.forEach(task => taskIds.push(task.id))
    })

    // Get impediments for all tasks in the workflow and workflow-level impediments
    let impediments: Record<string, unknown>[] = []
    let impedimentsError: Error | null = null
    
    if (taskIds.length > 0) {
      const { data: taskImpediments, error: taskImpedimentsError } = await supabase
        .from('workflow_impediments')
        .select('*')
        .in('task_id', taskIds)
      
      if (taskImpedimentsError) {
        impedimentsError = taskImpedimentsError
      } else {
        impediments = taskImpediments || []
      }
    }
    
    // Also get workflow-level impediments (impediments without task_id)
    const { data: workflowImpediments, error: workflowImpedimentsError } = await supabase
      .from('workflow_impediments')
      .select('*')
      .eq('workflow_id', id)
      .is('task_id', null)
    
    if (workflowImpedimentsError) {
      impedimentsError = workflowImpedimentsError
    } else {
      impediments = [...impediments, ...(workflowImpediments || [])]
    }

    if (stagesError) {
      console.error('Erro ao buscar etapas:', stagesError)
      return NextResponse.json(
        { error: 'Erro ao buscar etapas' },
        { status: 500 }
      )
    }

    if (impedimentsError) {
      console.error('Erro ao buscar impedimentos:', impedimentsError)
    }

    // Group impediments by stage_id (through task_id)
    const impedimentsByStage = (impediments || []).reduce((acc: Record<string, unknown[]>, impediment: Record<string, unknown>) => {
      let stageId: string | undefined
      
      // If impediment has task_id, find which stage this task belongs to
      if (impediment.task_id) {
        stageId = stages?.find(stage => {
          const stageTasks = stage.workflow_tasks as { id: string }[] || []
          return stageTasks.some(task => task.id === impediment.task_id)
        })?.id
      }
      // If impediment doesn't have task_id, it's a workflow-level impediment
      // We'll add it to the first stage for display purposes
      else if (stages && stages.length > 0) {
        stageId = stages[0].id as string
      }
      
      if (stageId) {
        if (!acc[stageId]) acc[stageId] = []
        acc[stageId].push(impediment)
      }
      return acc
    }, {})

    // Sort tasks by position within each stage and add impediments
    const stagesWithSortedTasks = (stages || []).map((stage: Record<string, unknown>) => ({
      ...stage,
      order_index: stage.position, // Map position to order_index for frontend compatibility
      workflow_tasks: ((stage.workflow_tasks as Record<string, unknown>[]) || []).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.position as number) - (b.position as number)),
      workflow_impediments: impedimentsByStage[stage.id as string] || []
    }))

    return NextResponse.json({ stages: stagesWithSortedTasks })
  } catch (error) {
    console.error('Erro na API de etapas do workflow:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/workflows/[id]/work-items - Create a new stage for a workflow
export async function POST(
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

    // Validate request body
    const body = await request.json()
    const validationResult = createWorkflowStageSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Get the next position
    const { data: lastStage } = await supabase
      .from('workflow_stages')
      .select('position')
      .eq('workflow_id', id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = lastStage ? lastStage.position + 1 : 1

    // Create the stage
    const stageData = {
      ...validationResult.data,
      workflow_id: id,
      position: nextPosition
    }

    const { data: stage, error: createError } = await supabase
      .from('workflow_stages')
      .insert([stageData])
      .select('*')
      .single()

    if (createError) {
      console.error('Erro ao criar etapa:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar etapa' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stage }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de etapa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}