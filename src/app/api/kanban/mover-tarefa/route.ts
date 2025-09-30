import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { MoverTarefaRequest } from '@/types/kanban'

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(await cookies())
    const body: MoverTarefaRequest = await request.json()

    const { tarefa_id, tipo_tarefa, novo_responsavel_id } = body

    // Validar parâmetros obrigatórios
    if (!tarefa_id || !tipo_tarefa || !novo_responsavel_id) {
      return NextResponse.json(
        { error: 'Parâmetros tarefa_id, tipo_tarefa e novo_responsavel_id são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['projeto', 'workflow'].includes(tipo_tarefa)) {
      return NextResponse.json(
        { error: 'tipo_tarefa deve ser "projeto" ou "workflow"' },
        { status: 400 }
      )
    }

    // Verificar se o novo responsável existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', novo_responsavel_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    let updateResult

    // Atualizar a tarefa na tabela apropriada
    if (tipo_tarefa === 'projeto') {
      updateResult = await supabase
        .from('tasks')
        .update({ assignee_id: novo_responsavel_id })
        .eq('id', tarefa_id)
        .select()

      if (updateResult.error) {
        console.error('Erro ao atualizar tarefa de projeto:', updateResult.error)
        return NextResponse.json(
          { error: 'Erro ao atualizar tarefa de projeto' },
          { status: 500 }
        )
      }

      if (!updateResult.data || updateResult.data.length === 0) {
        return NextResponse.json(
          { error: 'Tarefa de projeto não encontrada' },
          { status: 404 }
        )
      }
    } else {
      updateResult = await supabase
        .from('workflow_tasks')
        .update({ assigned_to: novo_responsavel_id })
        .eq('id', tarefa_id)
        .select()

      if (updateResult.error) {
        console.error('Erro ao atualizar tarefa de workflow:', updateResult.error)
        return NextResponse.json(
          { error: 'Erro ao atualizar tarefa de workflow' },
          { status: 500 }
        )
      }

      if (!updateResult.data || updateResult.data.length === 0) {
        return NextResponse.json(
          { error: 'Tarefa de workflow não encontrada' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Tarefa movida com sucesso',
      tarefa: updateResult.data[0]
    })
  } catch (error) {
    console.error('Erro na API mover-tarefa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}