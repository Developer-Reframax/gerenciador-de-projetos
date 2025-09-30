import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server'

// Interfaces para tipagem
interface TaskData {
  id: string
  status: 'completed' | 'cancelled' | 'todo' | 'in_progress' | 'review' | 'blocked'
}

interface ProjectData {
  id: string
  status: string
}

interface MemberData {
  user_id: string
}



export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar estatísticas em paralelo
    const [projectsResult, tasksResult, membersResult] = await Promise.all([
      // Projetos ativos (não arquivados)
      supabase
        .from('projects')
        .select('id, status')
        .eq('archived', false),
      
      // Tarefas por status
      supabase
        .from('tasks')
        .select('id, status')
        .in('status', ['todo', 'in_progress', 'completed']),
      
      // Membros únicos da equipe (colaboradores de projetos)
      supabase
        .from('project_collaborators')
        .select('user_id')
    ]);

    if (projectsResult.error) {
      console.error('Erro ao buscar projetos:', projectsResult.error);
      return NextResponse.json(
        { error: 'Erro ao buscar dados dos projetos' },
        { status: 500 }
      );
    }

    if (tasksResult.error) {
      console.error('Erro ao buscar tarefas:', tasksResult.error);
      return NextResponse.json(
        { error: 'Erro ao buscar dados das tarefas' },
        { status: 500 }
      );
    }

    if (membersResult.error) {
      console.error('Erro ao buscar membros:', membersResult.error);
      return NextResponse.json(
        { error: 'Erro ao buscar dados dos membros' },
        { status: 500 }
      );
    }

    // Processar dados
    const projects = projectsResult.data || [];
    const tasks = tasksResult.data || [];
    const members = membersResult.data || [];

    // Contar projetos ativos
    const activeProjects = projects.filter((p: ProjectData) => p.status === 'in_progress').length;
    
    // Contar tarefas por status
    const pendingTasks = tasks.filter((t: TaskData) => t.status === 'todo').length;
    const completedTasks = tasks.filter((t: TaskData) => t.status === 'completed').length;
    
    // Contar membros únicos da equipe
    const uniqueMembers = new Set(members.map((m: MemberData) => m.user_id)).size;

    const stats = {
      activeProjects,
      pendingTasks,
      completedTasks,
      teamMembers: uniqueMembers
    };

    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Erro interno na API de estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
