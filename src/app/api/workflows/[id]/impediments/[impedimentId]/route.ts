import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Schema for impediment update
const updateImpedimentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').optional(),
  description: z.string().optional(),
  status: z.enum(['aberto', 'em_resolucao', 'resolvido']).optional(),
  severity: z.enum(['baixa', 'media', 'alta', 'critica']).optional(),
  resolved_date: z.string().nullable().optional()
})

// PUT - Update an impediment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; impedimentId: string }> }
) {
  try {
    const { id: workflowId, impedimentId } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user || !user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verify user has access to this workflow
    const { error: workflowError } = await supabase
      .from('workflows')
      .select('id, created_by')
      .eq('id', workflowId)
      .eq('created_by', user.id)
      .single()

    if (workflowError) {
      if (workflowError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workflow não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar workflow:', workflowError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Verify impediment exists and belongs to this workflow
    const { data: existingImpediment, error: impedimentError } = await supabase
      .from('workflow_impediments')
      .select('id, workflow_id, status')
      .eq('id', impedimentId)
      .eq('workflow_id', workflowId)
      .single()

    if (impedimentError) {
      if (impedimentError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Impedimento não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar impedimento:', impedimentError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validationResult = updateImpedimentSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // If status is being changed to 'resolvido', set resolved_date
    if (updateData.status === 'resolvido' && existingImpediment.status !== 'resolvido') {
      updateData.resolved_date = new Date().toISOString().split('T')[0]
    }
    // If status is being changed from 'resolvido', clear resolved_date
    else if (updateData.status && updateData.status !== 'resolvido' && existingImpediment.status === 'resolvido') {
      updateData.resolved_date = undefined
    }

    // Update the impediment
    const { data: impediment, error: updateError } = await supabase
      .from('workflow_impediments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', impedimentId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Erro ao atualizar impedimento:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar impedimento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ impediment })
  } catch (error) {
    console.error('Erro na API de atualização de impedimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an impediment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; impedimentId: string }> }
) {
  try {
    const { id: workflowId, impedimentId } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user || !user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verify user has access to this workflow
    const { error: workflowError } = await supabase
      .from('workflows')
      .select('id, created_by')
      .eq('id', workflowId)
      .eq('created_by', user.id)
      .single()

    if (workflowError) {
      if (workflowError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workflow não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar workflow:', workflowError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Verify impediment exists and belongs to this workflow
    const { error: impedimentError } = await supabase
      .from('workflow_impediments')
      .select('id')
      .eq('id', impedimentId)
      .eq('workflow_id', workflowId)
      .single()

    if (impedimentError) {
      if (impedimentError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Impedimento não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar impedimento:', impedimentError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Delete the impediment
    const { error: deleteError } = await supabase
      .from('workflow_impediments')
      .delete()
      .eq('id', impedimentId)

    if (deleteError) {
      console.error('Erro ao excluir impedimento:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir impedimento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de exclusão de impedimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}