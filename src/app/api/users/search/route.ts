import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const excludeTeam = searchParams.get('exclude_team')
    
    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Buscar usuários que correspondem à query
    const usersQuery = supabase
      .from('users')
      .select('id, full_name, email, avatar_url')
      .eq('is_active', true)
      .is('deleted_at', null)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10)

    const { data: users, error: usersError } = await usersQuery

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      )
    }

    // Se excludeTeam foi fornecido, filtrar usuários que já são membros da equipe
    let filteredUsers = users || []
    
    if (excludeTeam) {
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', excludeTeam)
        .in('status', ['active', 'pending'])
        .is('deleted_at', null)

      if (!membersError && teamMembers) {
        const memberIds = teamMembers.map(member => member.user_id)
        filteredUsers = users?.filter(user => !memberIds.includes(user.id)) || []
      }
    }

    return NextResponse.json({ users: filteredUsers })
  } catch (error) {
    console.error('Erro na API de busca de usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}