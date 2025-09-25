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

const updateImpedimentSchema = createImpedimentSchema.partial()

// PUT - Atualizar impedimento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; impedimentId: string }> }
) {
  const { id: projectId, impedimentId } = await params
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
    
    console.log('PUT Impediment - Body recebido:', JSON.stringify(body, null, 2))
    console.log('PUT Impediment - Update data:', JSON.stringify(updateData, null, 2))
    console.log('PUT Impediment - Impediment ID from URL:', impedimentId)

    const validatedData = updateImpedimentSchema.parse(updateData)

    // Verificar se o impedimento existe e pertence ao projeto
    const { data: existingImpediment, error: impedimentError } = await supabase
      .from('impediments')
      .select(`
        id, 
        stage_id, 
        stage:stages!inner(id, project_id)
      `)
      .eq('id', impedimentId)
      .eq('stages.project_id', projectId)
      .single()

    if (impedimentError || !existingImpediment) {
      console.error('PUT Impediment - Impedimento não encontrado:', impedimentError)
      return NextResponse.json(
        { error: 'Impedimento não encontrado' },
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

    // Atualizar impedimento
    const { data: impediment, error: updateError } = await supabase
      .from('impediments')
      .update(validatedData)
      .eq('id', impedimentId)
      .select(`
        *,
        stage:stages(id, name),
        responsible_user:users!responsible_id(id, email, full_name, avatar_url)
      `)
      .single()

    if (updateError || !impediment) {
      console.error('Erro ao atualizar impedimento:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar impedimento' },
        { status: 500 }
      )
    }

    console.log('PUT Impediment - Impedimento atualizado com sucesso:', impediment.id)
    return NextResponse.json({ impediment })
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

// DELETE - Excluir impedimento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; impedimentId: string }> }
) {
  const { id: projectId, impedimentId } = await params
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

    // Verificar se o impedimento existe e pertence ao projeto
    const { data: existingImpediment, error: impedimentError } = await supabase
      .from('impediments')
      .select(`
        id, 
        stage_id, 
        stage:stages!inner(id, project_id)
      `)
      .eq('id', impedimentId)
      .eq('stages.project_id', projectId)
      .single()

    if (impedimentError || !existingImpediment) {
      return NextResponse.json(
        { error: 'Impedimento não encontrado' },
        { status: 404 }
      )
    }

    // Excluir impedimento
    const { error: deleteError } = await supabase
      .from('impediments')
      .delete()
      .eq('id', impedimentId)

    if (deleteError) {
      console.error('Erro ao excluir impedimento:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir impedimento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Impedimento excluído com sucesso' })
  } catch (error) {
    console.error('Erro na API de impedimentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}