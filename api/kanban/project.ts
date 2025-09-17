import { createServiceRoleClient } from '../../src/lib/supabase-server';
import type { KanbanProjectData, KanbanApiResponse } from '../../shared/types/kanban';

interface Request {
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  user?: { id: string };
}

interface Response {
  status(code: number): Response;
  json: (data: unknown) => Response;
}

const supabase = createServiceRoleClient();

/**
 * GET /api/kanban/project
 * Busca dados do Kanban por projeto
 */
export async function getKanbanProjectData(req: Request, res: Response) {
  try {
    const { project_id, team_id, status_filter } = req.query;

    // Validação dos parâmetros
    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: 'project_id é obrigatório'
      } as KanbanApiResponse<null>);
    }

    // Preparar filtros
    const statusArray = status_filter ? 
      (Array.isArray(status_filter) ? status_filter : [status_filter]) : 
      null;

    // Chamar função RPC do Supabase
    const { data, error } = await supabase.rpc('get_gantt_projects', {
      p_team_id: Array.isArray(team_id) ? team_id[0] : team_id || null,
      p_status: statusArray
    });

    if (error) {
      console.error('Erro ao buscar dados do projeto Kanban:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      } as KanbanApiResponse<null>);
    }

    // Verificar se o projeto existe
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      } as KanbanApiResponse<null>);
    }

    return res.json({
      success: true,
      data: data as unknown as KanbanProjectData
    } as KanbanApiResponse<KanbanProjectData>);

  } catch (error) {
    console.error('Erro na API getKanbanProjectData:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>);
  }
}

/**
 * GET /api/kanban/project/list
 * Lista projetos disponíveis para o usuário
 */
export async function getAvailableProjects(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      } as KanbanApiResponse<null>);
    }

    // Buscar todos os projetos ativos - qualquer usuário autenticado pode ver todos
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        team_id,
        teams!inner(name)
      `)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar projetos disponíveis:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      } as KanbanApiResponse<null>);
    }

    return res.json({
      success: true,
      data: data || []
    } as KanbanApiResponse<typeof data>);

  } catch (error) {
    console.error('Erro na API getAvailableProjects:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>);
  }
}