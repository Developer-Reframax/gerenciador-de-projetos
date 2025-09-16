import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '../../../../lib/supabase-server'
import type { Database } from '@/types/database'

type ProjectStatus = Database['public']['Tables']['projects']['Row']['status']

// GET - Buscar estatísticas de projetos
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar projetos do usuário para calcular estatísticas
    const { data: projects, error } = await supabase
      .from('projects')
      .select('status')
      .eq('owner_id', user.id)

    if (error) {
      console.error('Erro ao buscar projetos para estatísticas:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Calcular estatísticas
    const total = projects?.length || 0
    const statusCounts = projects.reduce((acc, project: { status: ProjectStatus }) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const stats = {
      total,
      completed: statusCounts.completed || 0,
      active: statusCounts.active || 0,
      planning: statusCounts.planning || 0,
      on_hold: statusCounts.on_hold || 0,
      cancelled: statusCounts.cancelled || 0
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Erro na API de estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}