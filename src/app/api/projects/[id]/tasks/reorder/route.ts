import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// POST /api/projects/[id]/tasks/reorder - Reorder tasks within a stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id: projectId } = await params
    const body = await request.json()
    const { taskId, newPosition, stageId } = body

    // Validate required fields
    if (!taskId || newPosition === undefined || !stageId) {
      return NextResponse.json(
        { error: 'taskId, newPosition e stageId são obrigatórios' },
        { status: 400 }
      )
    }

    if (typeof newPosition !== 'number' || newPosition < 0) {
      return NextResponse.json(
        { error: 'newPosition deve ser um número não negativo' },
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

    // Check if user is owner or team member with write access
    let hasAccess = project.owner_id === user.id

    if (!hasAccess) {
      const { data: collaborator } = await supabase
      .from('project_collaborators')
        .select('id, role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!collaborator && !!collaborator.role && ['admin', 'editor'].includes(collaborator.role)
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Verify stage belongs to project
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select('id, project_id')
      .eq('id', stageId)
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

    if (stage.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Estágio não encontrado' },
        { status: 404 }
      )
    }

    // Verify task exists and get current position
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, position, stage_id')
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
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const currentPosition = task.position
    const currentStageId = task.stage_id

    if (!currentStageId) {
      return NextResponse.json(
        { error: 'Tarefa sem estágio definido' },
        { status: 400 }
      )
    }

    if (currentPosition === null) {
      return NextResponse.json(
        { error: 'Tarefa sem posição definida' },
        { status: 400 }
      )
    }

    // If moving to a different stage
    if (currentStageId !== stageId) {
      // Verify new stage belongs to the same project
      const { data: newStage, error: newStageError } = await supabase
        .from('stages')
        .select('id, project_id')
        .eq('id', stageId)
        .single()

      if (newStageError || newStage.project_id !== projectId) {
        return NextResponse.json(
          { error: 'Estágio de destino inválido' },
          { status: 400 }
        )
      }

      // Get tasks in the new stage to determine max position
      const { data: newStageTasks, error: newStageTasksError } = await supabase
        .from('tasks')
        .select('position')
        .eq('stage_id', stageId)
        .order('position', { ascending: false })
        .limit(1)

      if (newStageTasksError) {
        console.error('Erro ao buscar tarefas do novo estágio:', newStageTasksError)
        return NextResponse.json(
          { error: 'Erro interno do servidor' },
          { status: 500 }
        )
      }

      const maxPositionInNewStage = newStageTasks.length > 0 ? newStageTasks[0].position : -1
      const finalPosition = Math.min(newPosition, (maxPositionInNewStage ?? -1) + 1)

      // Update tasks in new stage (shift positions)
      if (finalPosition <= (maxPositionInNewStage ?? -1)) {
        const { data: tasksToShift } = await supabase
          .from('tasks')
          .select('id, position')
          .eq('stage_id', stageId)
          .gte('position', finalPosition)

        if (tasksToShift && tasksToShift.length > 0) {
          for (const task of tasksToShift) {
            await supabase
              .from('tasks')
              .update({ position: (task.position ?? 0) + 1 })
              .eq('id', task.id)
          }
        }

        // Atualização das posições concluída
      }

      // Update tasks in old stage (close gap)
      // Reorganizar posições das tarefas no estágio antigo
      const { data: tasksToUpdate } = await supabase
        .from('tasks')
        .select('id, position')
        .eq('stage_id', currentStageId!)
        .gt('position', currentPosition!)

      if (tasksToUpdate && tasksToUpdate.length > 0) {
        const updates = tasksToUpdate.map(task => ({
          id: task.id,
          position: (task.position ?? 0) - 1
        }))

        for (const update of updates) {
          await supabase
            .from('tasks')
            .update({ position: update.position })
            .eq('id', update.id)
        }
      }

      // Atualização das posições concluída

      // Update the task with new stage and position
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          stage_id: stageId, 
          position: finalPosition 
        })
        .eq('id', taskId)

      if (updateError) {
        console.error('Erro ao mover tarefa:', updateError)
        return NextResponse.json(
          { error: 'Erro ao mover tarefa' },
          { status: 500 }
        )
      }

    } else {
      // Moving within the same stage
      if (currentPosition! === newPosition) {
        // No change needed
        return NextResponse.json({
          message: 'Posição não alterada'
        })
      }

      // Get all tasks in the stage to validate new position
      const { data: stageTasks, error: stageTasksError } = await supabase
        .from('tasks')
        .select('id, position')
        .eq('stage_id', stageId)
        .order('position', { ascending: true })

      if (stageTasksError) {
        console.error('Erro ao buscar tarefas do estágio:', stageTasksError)
        return NextResponse.json(
          { error: 'Erro interno do servidor' },
          { status: 500 }
        )
      }

      const maxPosition = stageTasks.length - 1
      const finalPosition = Math.min(newPosition, maxPosition)

      if (currentPosition! < finalPosition) {
        // Moving down: shift tasks up
        const { data: tasksToShift } = await supabase
          .from('tasks')
          .select('id, position')
          .eq('stage_id', stageId)
          .gt('position', currentPosition!)
          .lte('position', finalPosition)

        if (tasksToShift && tasksToShift.length > 0) {
          for (const task of tasksToShift) {
            await supabase
              .from('tasks')
              .update({ position: (task.position ?? 0) - 1 })
              .eq('id', task.id)
          }
        }

        // Atualização das posições concluída
      } else {
        // Moving up: shift tasks down
        const { data: tasksToShift } = await supabase
          .from('tasks')
          .select('id, position')
          .eq('stage_id', stageId)
          .gte('position', finalPosition)
          .lt('position', currentPosition!)

        if (tasksToShift && tasksToShift.length > 0) {
          for (const task of tasksToShift) {
            await supabase
              .from('tasks')
              .update({ position: (task.position ?? 0) + 1 })
              .eq('id', task.id)
          }
        }

        const shiftError = null // Placeholder para manter compatibilidade

        if (shiftError) {
          console.error('Erro ao reorganizar tarefas:', shiftError)
          return NextResponse.json(
            { error: 'Erro ao reorganizar tarefas' },
            { status: 500 }
          )
        }
      }

      // Update the task position
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ position: finalPosition })
        .eq('id', taskId)

      if (updateError) {
        console.error('Erro ao atualizar posição da tarefa:', updateError)
        return NextResponse.json(
          { error: 'Erro ao atualizar posição da tarefa' },
          { status: 500 }
        )
      }
    }

    // Get updated task list for the affected stages
    const stagesToUpdate = currentStageId !== stageId ? [currentStageId, stageId] : [stageId]
    
    const { data: updatedTasks, error: updatedTasksError } = await supabase
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
      .in('stage_id', stagesToUpdate)
      .order('position', { ascending: true })

    if (updatedTasksError) {
      console.error('Erro ao buscar tarefas atualizadas:', updatedTasksError)
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas atualizadas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tarefa reordenada com sucesso',
      tasks: updatedTasks
    })

  } catch (error) {
    console.error('Erro na API de reordenação de tarefas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}