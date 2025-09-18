import { createServiceRoleClient } from '../../../../src/lib/supabase-server';
import type { ProjectDeviationInsert } from '../../../../src/types/database';
// import type { ProjectDeviationWithUsers } from '../../../../src/types/database';

interface CreateDeviationForm {
  description: string;
  evaluation_criteria: string;
  impact_type: string;
  generates_impediment: boolean;
  requested_by: string;
}

interface Request {
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  user?: { id: string };
  body?: CreateDeviationForm;
}

interface Response {
  status(code: number): Response;
  json: (data: unknown) => Response;
}

const supabase = createServiceRoleClient();

/**
 * GET /api/projects/[id]/deviations
 * Lista todos os desvios de um projeto
 */
export async function getProjectDeviations(req: Request, res: Response) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do projeto é obrigatório'
      });
    }

    // Verificar se o projeto existe
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
    }

    // Buscar desvios do projeto com informações dos usuários
    const { data: deviations, error } = await supabase
      .from('project_deviations')
      .select(`
        *,
        requested_by_user:users!project_deviations_requested_by_fkey(
          id,
          full_name,
          email,
          avatar_url
        ),
        approver_user:users!project_deviations_approved_by_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar desvios do projeto:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }

    return res.json({
      success: true,
      data: deviations || []
    });

  } catch (error) {
    console.error('Erro na API getProjectDeviations:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * POST /api/projects/[id]/deviations
 * Cria um novo desvio para o projeto
 */
export async function createProjectDeviation(req: Request, res: Response) {
  try {
    const { id } = req.query;
    const {
      description,
      evaluation_criteria,
      impact_type,
      generates_impediment,
      requested_by
    } = req.body || {};

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do projeto é obrigatório'
      });
    }

    // Validar campos obrigatórios
    if (!description || !evaluation_criteria || !impact_type || !requested_by) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos obrigatórios devem ser preenchidos'
      });
    }

    // Verificar se o projeto existe
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
    }

    // Verificar se o usuário solicitante existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', requested_by)
      .single();

    if (userError || !user) {
      return res.status(400).json({
        success: false,
        error: 'Usuário solicitante não encontrado'
      });
    }

    // Criar o desvio
    const deviationData: ProjectDeviationInsert = {
        project_id: id,
        description,
        evaluation_criteria,
        impact_type,
        generates_impediment: Boolean(generates_impediment),
        requested_by,
        status: 'Pendente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newDeviation, error: createError } = await supabase
      .from('project_deviations')
      .insert(deviationData)
      .select(`
        *,
        requested_by_user:users!project_deviations_requested_by_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (createError) {
      console.error('Erro ao criar desvio:', createError);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }

    return res.status(201).json({
      success: true,
      data: newDeviation,
      message: 'Desvio criado com sucesso'
    });

  } catch (error) {
    console.error('Erro na API createProjectDeviation:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * Função auxiliar para validar formato de data
 */
// function isValidDate(dateString: string): boolean {
//   const regex = /^\d{4}-\d{2}-\d{2}$/;
//   if (!regex.test(dateString)) return false;
//   
//   const date = new Date(dateString);
//   return date instanceof Date && !isNaN(date.getTime());
// }