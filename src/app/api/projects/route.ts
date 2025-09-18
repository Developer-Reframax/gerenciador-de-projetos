import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { createProjectSchema } from '@/types/project'
import { cookies } from 'next/headers'

// GET - Listar projetos
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar projetos do usuário
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar projetos:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Erro na API de projetos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar projeto
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
    const validationResult = createProjectSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const projectData = {
      ...validationResult.data,
      owner_id: user.id,
      progress_percentage: 0
    }

    // Criar projeto
    const { data: project, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select('*')
        .single()

    if (error) {
      console.error('Erro ao criar projeto:', error)
      return NextResponse.json({ error: 'Erro ao criar projeto' }, { status: 500 })
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de projeto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
