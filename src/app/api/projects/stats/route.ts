import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET - Obter estatísticas dos projetos
export async function GET() {
  try {
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

    // Buscar equipes onde o usuário é membro (mesma lógica da listagem)
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)

    if (teamMembersError) {
      console.error('Erro ao buscar team_members:', teamMembersError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Se o usuário não faz parte de nenhuma equipe, retornar estatísticas zeradas
    if (!teamMembers || teamMembers.length === 0) {
      const emptyStats = {
        total: 0,
        completed: 0,
        in_progress: 0,
        not_started: 0,
        paused: 0,
        cancelled: 0,
        completion_rate: 0,
        by_status: {
          not_started: 0,
          in_progress: 0,
          completed: 0,
          paused: 0,
          cancelled: 0
        },
        by_priority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        }
      }
      return NextResponse.json({ stats: emptyStats })
    }

    // Extrair os team_ids
    const teamIds = teamMembers.map(tm => tm.team_id)

    // Buscar projetos das equipes onde o usuário é membro (mesma lógica da listagem)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, status, priority')
      .in('team_id', teamIds)

    if (projectsError) {
      console.error('Erro ao buscar projetos:', projectsError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Calcular estatísticas
    const projectsArray = projects || []
    const total = projectsArray.length
    const byStatus = {
      not_started: projectsArray.filter(p => p.status === 'not_started').length,
      in_progress: projectsArray.filter(p => p.status === 'in_progress').length,
      completed: projectsArray.filter(p => p.status === 'completed').length,
      paused: projectsArray.filter(p => p.status === 'paused').length,
      cancelled: projectsArray.filter(p => p.status === 'cancelled').length
    }

    const byPriority = {
      tactical: projectsArray.filter(p => p.priority === 'tactical').length,
        important: projectsArray.filter(p => p.priority === 'important').length,
        priority: projectsArray.filter(p => p.priority === 'priority').length
    }

    const completionRate = total > 0 ? Math.round((byStatus.completed / total) * 100) : 0

    const stats = {
      total,
      completed: byStatus.completed,
      in_progress: byStatus.in_progress,
      not_started: byStatus.not_started,
      paused: byStatus.paused,
      cancelled: byStatus.cancelled,
      completion_rate: completionRate,
      by_status: byStatus,
      by_priority: byPriority
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos projetos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
