import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Schema para validação dos dados de risco
const createRiskSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  stage_id: z.string().uuid('ID da etapa inválido'),
  status: z.enum(['identificado', 'em_analise', 'em_mitigacao', 'monitorado', 'materializado', 'encerrado']).default('identificado'),
  probability: z.enum(['baixa', 'media', 'alta']).default('media'),
  impact: z.enum(['prazo', 'custo', 'qualidade', 'reputacao']).default('prazo'),
  responsible_id: z.string().uuid().optional(),
  identification_date: z.string().optional(),
  expected_resolution_date: z.string().optional()
})



// GET - Listar riscos do projeto
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

    // Buscar riscos do projeto
    const { data: risks, error: risksError } = await supabase
      .from('risks')
      .select(`
        *,
        stage:stages(id, name),
        responsible_user:users!responsible_id(id, email, full_name, avatar_url)
      `)
      .in('stage_id', stageIds)
      .order('created_at', { ascending: false })

    if (risksError) {
      console.error('Erro ao buscar riscos:', risksError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ risks: risks || [] })
  } catch (error) {
    console.error('Erro na API de riscos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo risco
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
    const validatedData = createRiskSchema.parse(body)

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

    // Criar risco
    const insertData = {
      ...validatedData,
      identification_date: new Date().toISOString(),
      responsible_id: validatedData.responsible_id || user.id
    }

    const { data: risk, error: insertError } = await supabase
      .from('risks')
      .insert([insertData])
      .select(`
        *,
        stage:stages(id, name),
        responsible_user:users!responsible_id(id, email, full_name, avatar_url)
      `)
      .single()

    if (insertError || !risk) {
      console.error('Erro ao criar risco:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar risco' },
        { status: 500 }
      )
    }

    return NextResponse.json({ risk }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro na API de riscos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}