import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET - Listar todos os riscos globais do usuário
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

    // Buscar todos os riscos com suas relações
    // As políticas RLS do Supabase filtrarão automaticamente os dados que o usuário pode ver
    const { data: risks, error: risksError } = await supabase
      .from('risks')
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

    if (risksError) {
      console.error('Erro ao buscar riscos:', risksError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ risks: risks || [] })
  } catch (error) {
    console.error('Erro na API global de riscos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}