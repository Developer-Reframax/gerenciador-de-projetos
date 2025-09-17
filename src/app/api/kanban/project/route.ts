import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../../../lib/supabase-server';
import type { KanbanProjectData, KanbanApiResponse } from '../../../../../shared/types/kanban';

const supabase = createServiceRoleClient();

/**
 * GET /api/kanban/project
 * Busca dados do Kanban por projeto
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');
    const team_id = searchParams.get('team_id');
    const status_filter = searchParams.get('status_filter');

    // Validação dos parâmetros
    if (!project_id) {
      return NextResponse.json({
        success: false,
        error: 'project_id é obrigatório'
      } as KanbanApiResponse<null>, { status: 400 });
    }

    // Preparar filtros
    const statusArray = status_filter ? [status_filter] : null;

    // Chamar função RPC do Supabase
    const { data, error } = await supabase.rpc('get_gantt_projects', {
      p_team_id: team_id || null,
      p_status: statusArray
    });

    if (error) {
      console.error('Erro ao buscar dados do projeto Kanban:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro interno do servidor'
      } as KanbanApiResponse<null>, { status: 500 });
    }

    // Verificar se o projeto existe
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Projeto não encontrado'
      } as KanbanApiResponse<null>, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: data as unknown as KanbanProjectData
    } as KanbanApiResponse<KanbanProjectData>);

  } catch (error) {
    console.error('Erro na API getKanbanProjectData:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>, { status: 500 });
  }
}