import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createRouteHandlerClient } from '../../../../../lib/supabase-server';
import { cookies } from 'next/headers';
import type { KanbanApiResponse } from '../../../../../../shared/types/kanban';

/**
 * GET /api/kanban/project/available
 * Lista projetos disponíveis para filtros do Kanban
 */
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');
    
    // Buscar projetos disponíveis - qualquer usuário autenticado pode ver todos
    let query = supabaseAdmin
      .from('projects')
      .select('id, name')
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    // Filtrar por equipe se especificado
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

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
    console.error('Erro na API available projects:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>, { status: 500 });
  }
}