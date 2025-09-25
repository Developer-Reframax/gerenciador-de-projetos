import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET - Buscar todos os itens de trabalho de uma etapa (tarefas, riscos e impedimentos)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const { id: projectId, stageId } = await params
  try {
    const supabase = createRouteHandlerClient(await cookies())

    // Verificar se a etapa pertence ao projeto
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select('id, name, project_id')
      .eq('id', stageId)
      .eq('project_id', projectId)
      .single()

    if (stageError || !stage) {
      return NextResponse.json(
        { error: 'Etapa não encontrada ou não pertence ao projeto' },
        { status: 404 }
      )
    }

    // Buscar tarefas, riscos e impedimentos da etapa
    const [tasksResult, risksResult, impedimentsResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('stage_id', stageId),
      supabase
        .from('risks')
        .select('*')
        .eq('stage_id', stageId),
      supabase
        .from('impediments')
        .select('*')
        .eq('stage_id', stageId)
    ])

    if (tasksResult.error || risksResult.error || impedimentsResult.error) {
      console.error('Erro ao buscar itens da etapa:', {
        tasks: tasksResult.error,
        risks: risksResult.error,
        impediments: impedimentsResult.error
      })
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const tasks = tasksResult.data || []
    const risks = risksResult.data || []
    const impediments = impedimentsResult.data || []

    return NextResponse.json({
      stage: {
        id: stage.id,
        name: stage.name
      },
      items: {
        tasks,
        risks,
        impediments,
        total: tasks.length + risks.length + impediments.length
      }
    })
  } catch (error) {
    console.error('Erro na API de itens da etapa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}