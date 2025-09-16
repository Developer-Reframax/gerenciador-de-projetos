import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar atividades recentes de forma simples
    const { data: activities, error } = await supabase
      .from('task_status_history')
      .select('id, from_status, to_status, created_at, notes, task_id, changed_by')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    // Buscar informações dos usuários únicos
    const uniqueUserIds = [...new Set(activities?.map(a => a.changed_by).filter(Boolean) || [])]
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', uniqueUserIds)

    // Criar mapa de usuários para lookup rápido
    const userMap = new Map(users?.map(user => [user.id, user]) || [])

    // Formatar as atividades de forma simples
    interface ActivityData {
      id: string
      from_status: string | null
      to_status: string
      created_at: string | null
      notes: string | null
      task_id: string
      changed_by: string
    }

    const formattedActivities = activities?.map((activity: ActivityData) => {
      const action = getActionDescription(activity.from_status, activity.to_status)
      const user = userMap.get(activity.changed_by)
      
      return {
        id: activity.id,
        user: {
          id: activity.changed_by || '',
          name: user?.full_name || 'Usuário desconhecido',
          avatar: user?.avatar_url || ''
        },
        description: `${action} uma tarefa`,
        timestamp: activity.created_at,
        type: getActivityType(activity.from_status, activity.to_status)
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: formattedActivities
    })

  } catch (error) {
    console.error('Error in activities API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Função auxiliar para gerar descrição da ação
function getActionDescription(fromStatus: string | null, toStatus: string): string {
  if (!fromStatus) {
    return 'criou a tarefa'
  }

  const statusMap: Record<string, string> = {
    'todo': 'A Fazer',
    'in_progress': 'Em Progresso',
    'in_review': 'Em Revisão',
    'completed': 'Concluída',
    'cancelled': 'Cancelada'
  }

  const fromStatusText = statusMap[fromStatus] || fromStatus
  const toStatusText = statusMap[toStatus] || toStatus

  return `moveu de "${fromStatusText}" para "${toStatusText}"`
}

// Função auxiliar para determinar o tipo da atividade
function getActivityType(fromStatus: string | null, toStatus: string): string {
  if (!fromStatus) {
    return 'create'
  }
  
  if (toStatus === 'completed') {
    return 'complete'
  }
  
  if (toStatus === 'cancelled') {
    return 'cancel'
  }
  
  return 'update'
}