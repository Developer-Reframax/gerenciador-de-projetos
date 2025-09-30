import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { updateWorkflowSchema } from '@/types/workflow'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET - Buscar workflow por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase: SupabaseClient<Database> = createRouteHandlerClient(cookieStore)
    const { id } = await params
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select(`
        *,
        creator:users!workflows_created_by_fkey(
          id,
          email,
          full_name
        )
      `)
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Workflow não encontrado' }, { status: 404 })
      }
      console.error('Erro ao buscar workflow:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Calcular estatísticas do workflow
    const [stagesResult, tasksResult] = await Promise.all([
      // Buscar stages com suas tarefas
      supabase
        .from('workflow_stages')
        .select(`
          id,
          status,
          workflow_tasks!inner(id, status)
        `, { count: 'exact' })
        .eq('workflow_id', id),
      
      // Contar tasks
      supabase
        .from('workflow_tasks')
        .select('id, status', { count: 'exact' })
        .eq('workflow_id', id)
    ])

    // Calcular estatísticas
    const totalStages = stagesResult.count || 0
    const totalTasks = tasksResult.count || 0
    const completedTasks = tasksResult.data?.filter(task => task.status === 'concluida').length || 0
    
    // Calcular stages concluídos (stages onde todas as tarefas estão concluídas)
    let completedStages = 0
    if (stagesResult.data) {
      completedStages = stagesResult.data.filter(stage => {
        const stageTasks = stage.workflow_tasks || []
        if (stageTasks.length === 0) return false // Stage sem tarefas não é considerado concluído
        return stageTasks.every((task: { id: string; status: string | null }) => task.status === 'concluida')
      }).length
    }
    
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Adicionar estatísticas ao workflow
    const workflowWithStats = {
      ...workflow,
      total_stages: totalStages,
      completed_stages: completedStages,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      progress_percentage: progressPercentage
    }

    return NextResponse.json({ workflow: workflowWithStats })
  } catch (error) {
    console.error('Erro na API de busca de workflow:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase: SupabaseClient<Database> = createRouteHandlerClient(cookieStore)
    const { id } = await params
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Validar dados de entrada
    const body = await request.json()
    const validationResult = updateWorkflowSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Atualizar workflow
    const updateData = {
      ...validationResult.data,
      updated_at: new Date().toISOString()
    }
    
    const { data: workflow, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', id)
      .eq('created_by', user.id)
      .select(`
        *,
        creator:users!workflows_created_by_fkey(id, email, full_name)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Workflow não encontrado' }, { status: 404 })
      }
      console.error('Erro ao atualizar workflow:', error)
      return NextResponse.json({ error: 'Erro ao atualizar workflow' }, { status: 500 })
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Erro na API de atualização de workflow:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase: SupabaseClient<Database> = createRouteHandlerClient(cookieStore)
    const { id } = await params
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Deletar workflow
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Workflow não encontrado' }, { status: 404 })
      }
      console.error('Erro ao deletar workflow:', error)
      return NextResponse.json({ error: 'Erro ao deletar workflow' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Workflow deletado com sucesso' })
  } catch (error) {
    console.error('Erro na API de deleção de workflow:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}