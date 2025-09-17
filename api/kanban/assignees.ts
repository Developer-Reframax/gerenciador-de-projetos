import { createServiceRoleClient } from '../../src/lib/supabase-server';
import type { KanbanAssigneeData, KanbanApiResponse } from '../../shared/types/kanban';

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
 * GET /api/kanban/assignees
 * Busca dados do Kanban por responsáveis
 */
export async function getKanbanAssigneeData(req: Request, res: Response) {
  try {
    const { team_id } = req.query;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      } as KanbanApiResponse<null>);
    }

    // Validação dos parâmetros
    const teamIdString = Array.isArray(team_id) ? team_id[0] : team_id;
    if (!teamIdString) {
      return res.status(400).json({
        success: false,
        error: 'team_id é obrigatório'
      } as KanbanApiResponse<null>);
    }

    // Verificar se o usuário é membro da equipe
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamIdString)
      .eq('user_id', user_id)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado à equipe'
      } as KanbanApiResponse<null>);
    }

    // Removido projectArray pois não é usado na função RPC

    // Chamar função RPC do Supabase
    const { data, error } = await supabase.rpc('get_kanban_assignee_data', {
      p_team_id: teamIdString,
      p_priority_filter: null
    });

    if (error) {
      console.error('Erro ao buscar dados de responsáveis Kanban:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      } as KanbanApiResponse<null>);
    }

    // Verificar se a equipe existe
    if (!data || !('team_info' in data)) {
      return res.status(404).json({
        success: false,
        error: 'Equipe não encontrada'
      } as KanbanApiResponse<null>);
    }

    return res.json({
      success: true,
      data: data as unknown as KanbanAssigneeData
    } as KanbanApiResponse<KanbanAssigneeData>);

  } catch (error) {
    console.error('Erro na API getKanbanAssigneeData:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>);
  }
}

/**
 * GET /api/kanban/assignees/teams
 * Lista equipes disponíveis para o usuário
 */
export async function getAvailableTeams(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      } as KanbanApiResponse<null>);
    }

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        teams!inner(
          id,
          name,
          description
        )
      `)
      .eq('user_id', user_id);

    if (error) {
      console.error('Erro ao buscar equipes disponíveis:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      } as KanbanApiResponse<null>);
    }

    // Extrair apenas os dados das equipes
    const teams = (data && Array.isArray(data) && !('error' in data) ? data.map((item: { teams?: unknown }) => item.teams).filter(Boolean) : []) || [];

    return res.json({
      success: true,
      data: teams
    } as KanbanApiResponse<Array<{id: string; name: string; description: string}>>);

  } catch (error) {
    console.error('Erro na API getAvailableTeams:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>);
  }
}

/**
 * GET /api/kanban/assignees/projects
 * Lista projetos de uma equipe para filtros
 */
export async function getTeamProjects(req: Request, res: Response) {
  try {
    const { team_id } = req.query;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      } as KanbanApiResponse<null>);
    }

    const teamIdString = Array.isArray(team_id) ? team_id[0] : team_id;
    if (!teamIdString) {
      return res.status(400).json({
        success: false,
        error: 'team_id é obrigatório'
      } as KanbanApiResponse<null>);
    }

    // Verificar se o usuário é membro da equipe
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamIdString)
      .eq('user_id', user_id)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado à equipe'
      } as KanbanApiResponse<null>);
    }

    const { data, error } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('team_id', teamIdString)
      .in('status', ['planning', 'active', 'on_hold']);

    if (error) {
      console.error('Erro ao buscar projetos da equipe:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      } as KanbanApiResponse<null>);
    }

    return res.json({
      success: true,
      data: data || []
    } as KanbanApiResponse<Array<{id: string; name: string; status: string}>>);

  } catch (error) {
    console.error('Erro na API getTeamProjects:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>);
  }
}