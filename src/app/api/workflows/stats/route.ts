import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import type { WorkflowStats } from '@/types/workflow'

// GET - Obter estatísticas dos workflows
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar workflows criados pelo usuário autenticado
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflows')
      .select('id, status, category')
      .eq('created_by', user.id)

    if (workflowsError) {
      console.error('Erro ao buscar workflows:', workflowsError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Buscar tarefas dos workflows para calcular completion_rate
    const workflowIds = workflows?.map(w => w.id) || []
    let totalTasks = 0
    let completedTasks = 0

    if (workflowIds.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('workflow_tasks')
        .select('status')
        .in('workflow_id', workflowIds)

      if (!tasksError && tasks) {
        totalTasks = tasks.length
        completedTasks = tasks.filter(task => task.status === 'concluida').length
      }
    }

    // Calcular estatísticas
    const workflowsArray = workflows || []
    const total = workflowsArray.length

    const byStatus = {
      planejamento: workflowsArray.filter(w => w.status === 'planejamento').length,
      em_andamento: workflowsArray.filter(w => w.status === 'em_andamento').length,
      concluido: workflowsArray.filter(w => w.status === 'concluido').length,
      cancelado: workflowsArray.filter(w => w.status === 'cancelado').length
    }

    const byCategory = {
      iniciativa: workflowsArray.filter(w => w.category === 'iniciativa').length,
      melhoria: workflowsArray.filter(w => w.category === 'melhoria').length
    }

    const byPriority = {
      baixa: 0,
      media: 0,
      alta: 0,
      critica: 0
    }

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const stats: WorkflowStats = {
      total,
      by_status: byStatus,
      by_category: byCategory,
      by_priority: byPriority,
      completion_rate: completionRate,
      total_tasks: totalTasks,
      completed_tasks: completedTasks
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos workflows:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}