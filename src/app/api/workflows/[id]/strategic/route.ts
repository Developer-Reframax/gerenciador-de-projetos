import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { createWorkflowStrategicInfoSchema, updateWorkflowStrategicInfoSchema } from '@/types/workflow'
import { cookies } from 'next/headers'

// GET /api/workflows/[id]/strategic - Get strategic info for a workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .eq('id', id)
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

    // Get strategic info
    const { data: strategicInfo, error: strategicError } = await supabase
      .from('workflow_strategic_info')
      .select('*')
      .eq('workflow_id', id)
      .single()

    if (strategicError && strategicError.code !== 'PGRST116') {
      console.error('Erro ao buscar informações estratégicas:', strategicError)
      return NextResponse.json(
        { error: 'Erro ao buscar informações estratégicas' },
        { status: 500 }
      )
    }

    // If no strategic info exists, return null
    if (strategicError && strategicError.code === 'PGRST116') {
      return NextResponse.json({ strategicInfo: null })
    }

    return NextResponse.json({ strategicInfo })
  } catch (error) {
    console.error('Erro na API de informações estratégicas do workflow:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/workflows/[id]/strategic - Create strategic info for a workflow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .eq('id', id)
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

    // Check if strategic info already exists
    const { data: existingInfo } = await supabase
      .from('workflow_strategic_info')
      .select('id')
      .eq('workflow_id', id)
      .single()

    if (existingInfo) {
      return NextResponse.json(
        { error: 'Informações estratégicas já existem para este workflow' },
        { status: 409 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validationResult = createWorkflowStrategicInfoSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Create the strategic info
    const strategicData = validationResult.data
    
    const insertData = {
      workflow_id: id,
      strategic_data: strategicData.strategic_data ? JSON.stringify(strategicData.strategic_data) : null,
      metrics: strategicData.metrics ? JSON.stringify(strategicData.metrics) : null,
      kpis: strategicData.kpis ? JSON.stringify(strategicData.kpis) : null,
      actual_start_date: strategicData.actual_start_date || null,
      actual_end_date: strategicData.actual_end_date || null,
      tags: strategicData.tags ? JSON.stringify(strategicData.tags) : null
    }

    const { data: strategicInfo, error: createError } = await supabase
      .from('workflow_strategic_info')
      .insert([insertData])
      .select('*')
      .single()

    if (createError) {
      console.error('Erro ao criar informações estratégicas:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar informações estratégicas' },
        { status: 500 }
      )
    }

    return NextResponse.json({ strategicInfo }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de informações estratégicas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/workflows/[id]/strategic - Update strategic info for a workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .eq('id', id)
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

    // Validate request body
    const body = await request.json()
    const validationResult = updateWorkflowStrategicInfoSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Update the strategic info
    const strategicData = validationResult.data
    
    const updateData = {
      strategic_data: strategicData.strategic_data ? JSON.stringify(strategicData.strategic_data) : null,
      metrics: strategicData.metrics ? JSON.stringify(strategicData.metrics) : null,
      kpis: strategicData.kpis ? JSON.stringify(strategicData.kpis) : null,
      actual_start_date: strategicData.actual_start_date || null,
      actual_end_date: strategicData.actual_end_date || null,
      tags: strategicData.tags ? JSON.stringify(strategicData.tags) : null,
      updated_at: new Date().toISOString()
    }

    const { data: strategicInfo, error: updateError } = await supabase
      .from('workflow_strategic_info')
      .update(updateData)
      .eq('workflow_id', id)
      .select('*')
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Informações estratégicas não encontradas' },
          { status: 404 }
        )
      }
      console.error('Erro ao atualizar informações estratégicas:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar informações estratégicas' },
        { status: 500 }
      )
    }

    return NextResponse.json({ strategicInfo })
  } catch (error) {
    console.error('Erro na API de atualização de informações estratégicas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}