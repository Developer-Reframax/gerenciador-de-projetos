import { NextResponse } from 'next/server';
import { createServiceRoleClient, createRouteHandlerClient } from '../../../../../lib/supabase-server';
import { cookies } from 'next/headers';
import type { KanbanApiResponse } from '@/types/kanban';

/**
 * GET /api/kanban/project/list
 * Lista projetos disponíveis para o usuário
 */
export async function GET() {
  try {
    // Obter usuário autenticado usando cookies
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      } as KanbanApiResponse<null>, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();
    
    // Buscar todos os projetos ativos - qualquer usuário autenticado pode ver todos
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        team_id,
        teams(name)
      `)
      .eq('status', 'in_progress')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar projetos disponíveis:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro interno do servidor'
      } as KanbanApiResponse<null>, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    } as KanbanApiResponse<typeof data>);

  } catch (error) {
    console.error('Erro na API getAvailableProjects:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>, { status: 500 });
  }
}
