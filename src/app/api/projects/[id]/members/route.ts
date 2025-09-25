import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

interface Member {
  id: string
  name: string | null
  email: string
  avatar_url: string | null,
  role: string
  joined_at: string | null
  team_id: string | null
}

interface TeamMemberRaw {
  role: string
  joined_at: string | null
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const projectId = resolvedParams.id
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'ID do projeto é obrigatório' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar o team_id do projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('team_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('Erro ao buscar projeto:', projectError)
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    if (!project.team_id) {
      return NextResponse.json(
        { error: 'Projeto não possui equipe associada' },
        { status: 404 }
      )
    }

    console.log('Buscando membros para team_id:', project.team_id)

    // Buscar membros da equipe usando uma abordagem que evita relacionamentos aninhados
    // Primeiro buscar os team_members
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select('role, joined_at, user_id')
      .eq('team_id', project.team_id)

    if (teamMembersError) {
      console.error('Erro ao buscar team_members:', teamMembersError)
      return NextResponse.json(
        { error: 'Erro ao buscar membros da equipe' },
        { status: 500 }
      )
    }

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json([])
    }

    // Buscar dados dos usuários separadamente
    const userIds = teamMembers.map(tm => tm.user_id)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, avatar_url')
      .in('id', userIds)

    console.log('Team members:', teamMembers)
    console.log('Users:', users)
    console.log('Errors:', { teamMembersError, usersError })

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
      return NextResponse.json(
        { error: 'Erro ao buscar dados dos usuários' },
        { status: 500 }
      )
    }

    // Combinar os dados manualmente
    const members = teamMembers.map(tm => {
      const user = users?.find(u => u.id === tm.user_id)
      return {
        role: tm.role,
        joined_at: tm.joined_at,
        id: user?.id || tm.user_id,
        full_name: user?.full_name || null,
        email: user?.email || '',
        avatar_url: user?.avatar_url || null
      }
    })

    // Transformar dados com tipos específicos
    const formattedMembers: Member[] = (members || []).map((member: TeamMemberRaw) => {
      console.log('Processando membro:', member)
      return {
        id: member.id,
        team_id: project.team_id,
        name: member.full_name,
        email: member.email || '',
        avatar_url: member.avatar_url,
        role: member.role,
        joined_at: member.joined_at
      }
    })

    console.log('Membros formatados:', formattedMembers)

    return NextResponse.json(formattedMembers)
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}