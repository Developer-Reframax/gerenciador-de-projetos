// Tipos básicos para Request e Response
interface Request {
  query: Record<string, string | string[]>;
  user?: { id: string };
}

interface Response {
  status(code: number): Response;
  json(data: unknown): Response;
}

import { createServiceRoleClient } from '../../src/lib/supabase-server';
import type { KanbanProjectStatusData, KanbanApiResponse, KanbanProject } from '../../shared/types/kanban';

// Cliente Supabase para operações do servidor
const supabase = createServiceRoleClient();

/**
 * GET /api/kanban/project-status
 * Busca dados do Kanban por status de projeto
 */
export async function getKanbanProjectStatusData(req: Request, res: Response) {
  try {
    const { team_id, priority_filter } = req.query;
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

    // Se team_id for fornecido, verificar se o usuário é membro
    if (teamIdString) {
      const { data: membership, error: membershipError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamIdString)
        .eq('user_id', user_id)
        .single();

      if (membershipError || !membership) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado: usuário não é membro da equipe'
        } as KanbanApiResponse<null>);
      }
    }

    // Preparar filtros
    const priorityArray = priority_filter ? 
      (Array.isArray(priority_filter) ? priority_filter : [priority_filter]) : 
      null;

    // Chamar função RPC do Supabase
    const { data, error } = await supabase.rpc('get_kanban_project_status_data', {
      p_team_id: teamIdString,
      p_priority_filter: priorityArray ? priorityArray.join(',') : null
    });

    if (error) {
      console.error('Erro ao buscar dados de status de projeto Kanban:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      } as KanbanApiResponse<null>);
    }

    return res.json({
      success: true,
      data: {
        ...data,
        status_columns: []
      } as KanbanProjectStatusData
    } as KanbanApiResponse<KanbanProjectStatusData>);

  } catch (error) {
    console.error('Erro na API getKanbanProjectStatusData:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>);
  }
}

/**
 * GET /api/kanban/project-status/stats
 * Busca estatísticas gerais dos projetos
 */
export async function getProjectStatusStats(req: Request, res: Response) {
  try {
    const { team_id } = req.query;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      } as KanbanApiResponse<null>);
    }

    let query = supabase
      .from('projects')
      .select(`
        status,
        priority,
        start_date,
        end_date,
        team_id
      `);

    // Filtrar por equipe se especificado
    if (team_id) {
      // Verificar se o usuário é membro da equipe
      const teamIdString = Array.isArray(team_id) ? team_id[0] : team_id;
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

      query = query.eq('team_id', team_id as string);
    } else {
      // Filtrar apenas projetos de equipes onde o usuário é membro
      const { data: userTeams } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user_id);

      if (userTeams && userTeams.length > 0) {
        const teamIds = userTeams.map((t: { team_id: string }) => t.team_id);
        query = query.in('team_id', teamIds);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar estatísticas de projetos:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      } as KanbanApiResponse<null>);
    }

    // Calcular estatísticas
    const validData = data && Array.isArray(data) && !('error' in data) ? data : [];
    const projects: KanbanProject[] = [];
    
    for (const item of validData) {
      if (item && typeof item === 'object' && !('error' in item) && 
          'status' in item && 'priority' in item && 'id' in item && 'name' in item) {
        projects.push(item as KanbanProject);
      }
    }
    
    const stats = {
      total_projects: projects.length,
      by_status: {
        planning: projects.filter((p) => p.status === 'planning').length,
        active: projects.filter((p) => p.status === 'active').length,
        completed: projects.filter((p) => p.status === 'completed').length,
        on_hold: projects.filter((p) => p.status === 'on_hold').length,
        cancelled: projects.filter((p) => p.status === 'cancelled').length
      },
      by_priority: {
        low: projects.filter((p) => p.priority === 'low').length,
        medium: projects.filter((p) => p.priority === 'medium').length,
        high: projects.filter((p) => p.priority === 'high').length,
        urgent: projects.filter((p) => p.priority === 'urgent').length
      },
      overdue_projects: (() => {
        let count = 0;
        for (const p of projects) {
          if (p.end_date) {
            const endDate = new Date(p.end_date);
            const today = new Date();
            if (endDate < today && p.status !== 'completed') {
              count++;
            }
          }
        }
        return count;
      })()
    };

    return res.json({
      success: true,
      data: stats || {}
    } as KanbanApiResponse<typeof stats>);

  } catch (error) {
    console.error('Erro na API getProjectStatusStats:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>);
  }
}