import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET - Listar todos os impedimentos globais do usuário
export async function GET() {
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

    // Buscar todos os impedimentos com suas relações
    // As políticas RLS do Supabase filtrarão automaticamente os dados que o usuário pode ver
    const { data: impediments, error: impedimentsError } = await supabase
      .from('impediments')
      .select(`
        *,
        stage:stages!inner(
          id,
          name,
          project:projects!inner(
            id,
            name
          )
        ),
        responsible_user:users!responsible_id(id, email, full_name, avatar_url)
      `)
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
    console.error('Erro na API global de impedimentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}