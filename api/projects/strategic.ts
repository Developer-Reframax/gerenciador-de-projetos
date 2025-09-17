import { createServiceRoleClient } from '../../src/lib/supabase-server';

interface UpdateProjectStrategicForm {
  strategic_objective_id?: string | null;
  strategic_pillar_id?: string | null;
  request_date?: string | null;
  committee_approval_date?: string | null;
  real_start_date?: string | null;
  real_end_date?: string | null;
  tag_ids?: string[];
}

interface Request {
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  user?: { id: string };
  body?: UpdateProjectStrategicForm;
}

interface Response {
  status(code: number): Response;
  json: (data: unknown) => Response;
}

const supabase = createServiceRoleClient();

/**
 * GET /api/projects/[id]/strategic
 * Busca informações estratégicas de um projeto
 */
export async function getProjectStrategicInfo(req: Request, res: Response) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do projeto é obrigatório'
      });
    }

    // Buscar informações estratégicas do projeto
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        strategic_objective_id,
        strategic_pillar_id,
        request_date,
        committee_approval_date,
        real_start_date,
        real_end_date,
        strategic_objectives(id, name, description),
        strategic_pillars(id, name, description),
        project_tags(
          id,
          tags(id, name, color)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar informações estratégicas do projeto:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
    }

    return res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Erro na API getProjectStrategicInfo:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * PUT /api/projects/[id]/strategic
 * Atualiza informações estratégicas de um projeto
 */
export async function updateProjectStrategicInfo(req: Request, res: Response) {
  try {
    const { id } = req.query;
    const {
      strategic_objective_id,
      strategic_pillar_id,
      request_date,
      committee_approval_date,
      real_start_date,
      real_end_date,
      tag_ids
    } = req.body || {};

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do projeto é obrigatório'
      });
    }

    // Validar datas se fornecidas
    const dateFields = {
      request_date,
      committee_approval_date,
      real_start_date,
      real_end_date
    };

    for (const [field, value] of Object.entries(dateFields)) {
      if (value && !isValidDate(value)) {
        return res.status(400).json({
          success: false,
          error: `${field} deve estar no formato YYYY-MM-DD`
        });
      }
    }

    // Verificar se o projeto existe
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
    }

    // Atualizar informações estratégicas do projeto
    const updateData: Partial<{
      strategic_objective_id: string | null;
      strategic_pillar_id: string | null;
      request_date: string | null;
      committee_approval_date: string | null;
      real_start_date: string | null;
      real_end_date: string | null;
      updated_at: string;
    }> = {};
    
    if (strategic_objective_id !== undefined) {
      updateData.strategic_objective_id = strategic_objective_id || null;
    }
    
    if (strategic_pillar_id !== undefined) {
      updateData.strategic_pillar_id = strategic_pillar_id || null;
    }
    
    if (request_date !== undefined) {
      updateData.request_date = request_date || null;
    }
    
    if (committee_approval_date !== undefined) {
      updateData.committee_approval_date = committee_approval_date || null;
    }
    
    if (real_start_date !== undefined) {
      updateData.real_start_date = real_start_date || null;
    }
    
    if (real_end_date !== undefined) {
      updateData.real_end_date = real_end_date || null;
    }

    updateData.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Erro ao atualizar projeto:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }

    // Atualizar tags do projeto se fornecidas
    if (tag_ids !== undefined) {
      // Remover todas as tags existentes do projeto
      const { error: deleteError } = await supabase
        .from('project_tags')
        .delete()
        .eq('project_id', id);

      if (deleteError) {
        console.error('Erro ao remover tags do projeto:', deleteError);
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }

      // Adicionar novas tags se fornecidas
      if (Array.isArray(tag_ids) && tag_ids.length > 0) {
        const tagInserts = tag_ids.map(tag_id => ({
          project_id: id,
          tag_id
        }));

        const { error: insertError } = await supabase
          .from('project_tags')
          .insert(tagInserts);

        if (insertError) {
          console.error('Erro ao adicionar tags ao projeto:', insertError);
          return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
          });
        }
      }
    }

    // Buscar dados atualizados do projeto
    const { data: updatedProject, error: fetchError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        strategic_objective_id,
        strategic_pillar_id,
        request_date,
        committee_approval_date,
        real_start_date,
        real_end_date,
        strategic_objectives(id, name, description),
        strategic_pillars(id, name, description),
        project_tags(
          id,
          tags(id, name, color)
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar projeto atualizado:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }

    return res.json({
      success: true,
      data: updatedProject
    });

  } catch (error) {
    console.error('Erro na API updateProjectStrategicInfo:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * Valida se uma string está no formato de data YYYY-MM-DD
 */
function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}