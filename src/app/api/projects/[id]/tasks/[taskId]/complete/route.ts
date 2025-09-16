import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    const { id, taskId } = await params

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se a tarefa pertence ao projeto através do stage
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id,
        stage:stages!inner(id, project_id)
      `)
      .eq('id', taskId)
      .single()

    if (taskError || !taskData) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    if (taskData.stage.project_id !== id) {
      return NextResponse.json(
        { error: 'Tarefa não pertence ao projeto especificado' },
        { status: 404 }
      )
    }

    // Atualizar status da tarefa para 'completed'
    // O RLS vai gerenciar as permissões automaticamente
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        status: 'completed'
      })
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao marcar tarefa como concluída:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar tarefa' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Tarefa marcada como concluída com sucesso',
      task: data
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}