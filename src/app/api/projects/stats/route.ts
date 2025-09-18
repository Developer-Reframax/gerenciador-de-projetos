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

    // Buscar projetos onde o usuário é owner
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('id, status, priority')
      .eq('owner_id', user.id)

    if (ownedError) {
      console.error('Erro ao buscar projetos próprios:', ownedError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Buscar projetos onde o usuário é colaborador
    const { data: collaboratorProjects, error: collaboratorError } = await supabase
      .from('project_collaborators')
      .select('project_id, projects(id, status, priority)')
      .eq('user_id', user.id)

    if (collaboratorError) {
      console.error('Erro ao buscar projetos como colaborador:', collaboratorError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Combinar resultados removendo duplicatas
    const projectsMap = new Map()
    
    // Adicionar projetos próprios
    ownedProjects?.forEach(project => {
      projectsMap.set(project.id, { status: project.status, priority: project.priority })
    })
    
    // Adicionar projetos como colaborador
    collaboratorProjects?.forEach(collab => {
      if (collab.projects) {
        projectsMap.set(collab.projects.id, { 
          status: collab.projects.status, 
          priority: collab.projects.priority 
        })
      }
    })
    
    const projects = Array.from(projectsMap.values())

    // Calcular estatísticas
    const projectsArray = projects || []
    const total = projectsArray.length
    const byStatus = {
      planning: projectsArray.filter(p => p.status === 'planning').length,
      active: projectsArray.filter(p => p.status === 'active').length,
      completed: projectsArray.filter(p => p.status === 'completed').length,
      on_hold: projectsArray.filter(p => p.status === 'on_hold').length,
      cancelled: projectsArray.filter(p => p.status === 'cancelled').length
    }

    const byPriority = {
      low: projectsArray.filter(p => p.priority === 'low').length,
      medium: projectsArray.filter(p => p.priority === 'medium').length,
      high: projectsArray.filter(p => p.priority === 'high').length,
      urgent: projectsArray.filter(p => p.priority === 'urgent').length
    }

    const completionRate = total > 0 ? Math.round((byStatus.completed / total) * 100) : 0

    const stats = {
      total,
      completed: byStatus.completed,
      active: byStatus.active,
      planning: byStatus.planning,
      on_hold: byStatus.on_hold,
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
