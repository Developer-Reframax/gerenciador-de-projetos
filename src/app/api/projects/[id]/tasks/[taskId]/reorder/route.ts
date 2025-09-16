import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// Interface for the task data returned by get_stage_tasks_ordered RPC
interface TaskWithDetails {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  assigned_to: string | null
  estimated_hours: number | null
  position: number
  stage_id: string
  created_at: string
}

// PUT /api/projects/[id]/tasks/[taskId]/reorder - Reorder a specific task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params
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
    const { position } = body

    // Validate required fields
    if (position === undefined || typeof position !== 'number' || position < 0) {
      return NextResponse.json(
        { error: 'Position deve ser um número não negativo' },
        { status: 400 }
      )
    }

    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', projectId)
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
        .select('id, role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!collaborator && ['admin', 'editor'].includes(collaborator.role)
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Use RPC function to reorder task
    // @ts-expect-error - Custom RPC function not in generated types
    const { error: reorderError } = await supabase.rpc('reorder_tasks_in_stage', {
      p_task_id: taskId,
      p_new_position: position
    })

    if (reorderError) {
      console.error('Erro ao reordenar tarefa:', reorderError)
      return NextResponse.json(
        { error: 'Erro ao reordenar tarefa' },
        { status: 500 }
      )
    }

    // Get the stage_id from the task to fetch updated tasks
    const { data: taskInfo, error: taskInfoError } = await supabase
      .from('tasks')
      .select('stage_id')
      .eq('id', taskId)
      .single()

    if (taskInfoError) {
      console.error('Erro ao buscar informações da tarefa:', taskInfoError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Get updated task list for the stage using RPC function
    // @ts-expect-error - Custom RPC function not in generated types
    const { data: updatedTasks, error: updatedTasksError } = await supabase.rpc('get_stage_tasks_ordered', {
      p_stage_id: taskInfo.stage_id
    })

    if (updatedTasksError) {
      console.error('Erro ao buscar tarefas atualizadas:', updatedTasksError)
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas atualizadas' },
        { status: 500 }
      )
    }

    // Type the updated tasks properly
    const tasks: TaskWithDetails[] = Array.isArray(updatedTasks) ? updatedTasks as TaskWithDetails[] : []

    return NextResponse.json({
      message: 'Tarefa reordenada com sucesso',
      tasks: tasks
    })

  } catch (error) {
    console.error('Erro na API de reordenação de tarefa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}