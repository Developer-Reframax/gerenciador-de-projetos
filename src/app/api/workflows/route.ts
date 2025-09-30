import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { createWorkflowSchema } from '@/types/workflow'
import { cookies } from 'next/headers'

// GET - Listar workflows
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar workflows criados pelo usuário autenticado
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar workflows:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    return NextResponse.json({ workflows })
  } catch (error) {
    console.error('Erro na API de workflows:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar workflow
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Validar dados de entrada
    const body = await request.json()
    const validationResult = createWorkflowSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const workflowData = {
      ...validationResult.data,
      created_by: user.id,
      progress_percentage: 0
    }

    // Criar workflow
    const { data: workflow, error } = await supabase
        .from('workflows')
        .insert([workflowData])
        .select('*')
        .single()

    if (error) {
      console.error('Erro ao criar workflow:', error)
      return NextResponse.json({ error: 'Erro ao criar workflow' }, { status: 500 })
    }

    return NextResponse.json({ workflow }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de workflow:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}