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

const updateRiskSchema = createRiskSchema.partial()

// PUT - Atualizar risco
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; riskId: string }> }
) {
  const { id: projectId, riskId } = await params
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
    const updateData = body
    
    console.log('PUT Risk - Body recebido:', JSON.stringify(body, null, 2))
    console.log('PUT Risk - Update data:', JSON.stringify(updateData, null, 2))
    console.log('PUT Risk - Risk ID from URL:', riskId)

    try {
      const validatedData = updateRiskSchema.parse(updateData)
      console.log('PUT Risk - Dados validados:', JSON.stringify(validatedData, null, 2))
    } catch (validationError) {
      console.error('PUT Risk - Erro de validação:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: validationError.issues },
          { status: 400 }
        )
      }
      throw validationError
    }
    
    const validatedData = updateRiskSchema.parse(updateData)

    // Verificar se o risco existe e pertence ao projeto
    const { data: existingRisk, error: riskError } = await supabase
      .from('risks')
      .select(`
        id, 
        stage_id, 
        stage:stages!inner(id, project_id)
      `)
      .eq('id', riskId)
      .eq('stages.project_id', projectId)
      .single()

    if (riskError || !existingRisk) {
      console.error('PUT Risk - Risco não encontrado:', riskError)
      return NextResponse.json(
        { error: 'Risco não encontrado' },
        { status: 404 }
      )
    }

    // Se stage_id foi fornecido, verificar se pertence ao projeto
    if (validatedData.stage_id) {
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
    }

    // Atualizar risco
    const { data: risk, error: updateError } = await supabase
      .from('risks')
      .update(validatedData)
      .eq('id', riskId)
      .select(`
        *,
        stage:stages(id, name),
        responsible_user:users!responsible_id(id, email, full_name, avatar_url)
      `)
      .single()

    if (updateError || !risk) {
      console.error('Erro ao atualizar risco:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar risco' },
        { status: 500 }
      )
    }

    console.log('PUT Risk - Risco atualizado com sucesso:', risk.id)
    return NextResponse.json({ risk })
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

// DELETE - Excluir risco
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; riskId: string }> }
) {
  const { id: projectId, riskId } = await params
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

    // Verificar se o risco existe e pertence ao projeto
    const { data: existingRisk, error: riskError } = await supabase
      .from('risks')
      .select(`
        id, 
        stage_id, 
        stage:stages!inner(id, project_id)
      `)
      .eq('id', riskId)
      .eq('stages.project_id', projectId)
      .single()

    if (riskError || !existingRisk) {
      return NextResponse.json(
        { error: 'Risco não encontrado' },
        { status: 404 }
      )
    }

    // Excluir risco
    const { error: deleteError } = await supabase
      .from('risks')
      .delete()
      .eq('id', riskId)

    if (deleteError) {
      console.error('Erro ao excluir risco:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir risco' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Risco excluído com sucesso' })
  } catch (error) {
    console.error('Erro na API de riscos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}