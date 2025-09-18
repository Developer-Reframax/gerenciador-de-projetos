import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

interface GanttProjectData {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  due_date: string;
  progress_percentage: number;
  owner_name: string;
  team_name: string;
  total_tasks: number;
  completed_tasks: number;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extrair parâmetros de query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status')?.split(',') || null;
    const priority = searchParams.get('priority')?.split(',') || null;
    const team_id = searchParams.get('team_id') || null;
    const start_date = searchParams.get('start_date') || null;
    const end_date = searchParams.get('end_date') || null;

    // Chamar a função do banco de dados
    const { data: projects, error } = await supabase
      .rpc('get_gantt_projects', {
        p_status: status,
        p_priority: priority,
        p_team_id: team_id,
        p_start_date: start_date,
        p_end_date: end_date
      });

    if (error) {
      console.error('Erro ao buscar projetos do Gantt:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    // Transformar os dados para o formato esperado pelo frontend
    const transformedProjects = projects?.map((project: GanttProjectData) => ({
      id: project.id,
      name: project.name,
      description: project.description || null,
      status: project.status,
      priority: project.priority,
      start_date: project.start_date || null,
      due_date: project.due_date || null,
      progress_percentage: project.progress_percentage || 0,
      owner: {
        id: project.id, // Usando o ID do projeto como fallback
        full_name: project.owner_name
      },
      team: project.team_name ? {
        id: project.id, // Usando o ID do projeto como fallback
        name: project.team_name
      } : null,
      total_tasks: project.total_tasks || 0,
      completed_tasks: project.completed_tasks || 0
    })) || [];

    return NextResponse.json({
      projects: transformedProjects,
      total: transformedProjects.length
    });

  } catch (error) {
    console.error('Erro na API do Gantt:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
