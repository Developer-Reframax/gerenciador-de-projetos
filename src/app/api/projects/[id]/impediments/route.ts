import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Schema para validação dos dados de impedimento
const createImpedimentSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  stage_id: z.string().uuid('ID da etapa inválido'),
  criticality: z.enum(['alta', 'media', 'baixa']).default('media'),
  status: z.enum(['aberto', 'em_resolucao', 'resolvido', 'cancelado']).default('aberto'),
  responsible_id: z.string().uuid().optional(),
  identification_date: z.string().optional(),
  expected_resolution_date: z.string().optional()
})



// GET - Listar impedimentos do projeto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  try {
    const supabase = createRouteHandlerClient(await cookies())

    // Primeiro, buscar os stage_ids do projeto
    const { data: projectStages, error: stagesError } = await supabase
      .from('stages')
      .select('id')
      .eq('project_id', projectId)

    if (stagesError) {
      console.error('Erro ao buscar etapas:', stagesError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const stageIds = projectStages?.map(stage => stage.id) || []

    // Buscar impedimentos do projeto
    const { data: impediments, error: impedimentsError } = await supabase
      .from('impediments')
      .select(`
        *,
        stage:stages(id, name),
        responsible_user:users!responsible_id(id, email, full_name, avatar_url)
      `)
      .in('stage_id', stageIds)
      .order('created_at', { ascending: false })

    if (impedimentsError) {
      console.error('Erro ao buscar impedimentos:', impedimentsError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
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

// POST - Criar novo impedimento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  try {
    const supabase = createRouteHandlerClient(await cookies())

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Validar dados do request
    const body = await request.json()
    const validatedData = createImpedimentSchema.parse(body)

    // Verificar se a etapa pertence ao projeto
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select('id, project_id')
      .eq('id', validatedData.stage_id)
      .eq('project_id', projectId)
      .single()

    if (stageError || !stage) {
      return NextResponse.json(
        { error: 'Etapa não encontrada ou não pertence ao projeto' },
        { status: 404 }
      )
    }

    // Criar impedimento
    const insertData = {
      ...validatedData,
      identification_date: new Date().toISOString(),
      responsible_id: validatedData.responsible_id || user.id
    }

    const { data: impediment, error: insertError } = await supabase
      .from('impediments')
      .insert([insertData])
      .select(`
        *,
        stage:stages(id, name),
        responsible_user:users!responsible_id(id, email, full_name, avatar_url)
      `)
      .single()

    if (insertError || !impediment) {
      console.error('Erro ao criar impedimento:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar impedimento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ impediment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro na API de impedimentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}