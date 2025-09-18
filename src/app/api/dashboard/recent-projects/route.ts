import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server'

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

    // Buscar projetos do usuário de forma simples
    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, name, description, status, priority, due_date, created_at, updated_at, owner_id, total_tasks, completed_tasks, progress_percentage')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Buscar dados do usuário atual para owner info
    const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .single();

    // Formatar os projetos de forma simples
    const projectsWithStats = projects?.map((project) => {
        return {
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            priority: project.priority,
            progress_percentage: project.progress_percentage || 0,
            due_date: project.due_date,
            total_tasks: project.total_tasks || 0,
            completed_tasks: project.completed_tasks || 0,
            owner: {
                full_name: userData?.full_name || 'Usuário desconhecido',
                avatar_url: userData?.avatar_url
            }
        };
    }) || [];

    return NextResponse.json({ data: projectsWithStats });
    
  } catch (error) {
    console.error('Erro interno na API de projetos recentes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
