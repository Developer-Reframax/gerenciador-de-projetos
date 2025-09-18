import { createServiceRoleClient } from '../../../../../src/lib/supabase-server';
import type { ProjectDeviationUpdate } from '../../../../../src/types/database';

interface UpdateDeviationForm {
  description?: string;
  evaluation_criteria?: string;
  impact_type?: string;
  generates_impediment?: boolean;
  status?: string;
  approver_id?: string | null;
  approved_at?: string | null;
}

interface Request {
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  user?: { id: string };
  body?: UpdateDeviationForm;
}

interface Response {
  status(code: number): Response;
  json: (data: unknown) => Response;
}

const supabase = createServiceRoleClient();

/**
 * GET /api/projects/[id]/deviations/[deviationId]
 * Busca um desvio específico
 */
export async function getProjectDeviation(req: Request, res: Response) {
  try {
    const { id, deviationId } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do projeto é obrigatório'
      });
    }

    if (!deviationId || typeof deviationId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do desvio é obrigatório'
      });
    }

    // Buscar o desvio específico
    const { data: deviation, error } = await supabase
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
      .eq('id', deviationId)
      .eq('project_id', id)
      .single();

    if (error || !deviation) {
      return res.status(404).json({
        success: false,
        error: 'Desvio não encontrado'
      });
    }

    return res.json({
      success: true,
      data: deviation
    });

  } catch (error) {
    console.error('Erro na API getProjectDeviation:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * PUT /api/projects/[id]/deviations/[deviationId]
 * Atualiza um desvio específico
 */
export async function updateProjectDeviation(req: Request, res: Response) {
  try {
    const { id, deviationId } = req.query;
    const {
      description,
      evaluation_criteria,
      impact_type,
      generates_impediment,
      status,
      approver_id,
      approved_at
    } = req.body || {};

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do projeto é obrigatório'
      });
    }

    if (!deviationId || typeof deviationId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do desvio é obrigatório'
      });
    }

    // Verificar se o desvio existe
    const { data: existingDeviation, error: deviationError } = await supabase
      .from('project_deviations')
      .select('id, project_id, status')
      .eq('id', deviationId)
      .eq('project_id', id)
      .single();

    if (deviationError || !existingDeviation) {
      return res.status(404).json({
        success: false,
        error: 'Desvio não encontrado'
      });
    }

    // Validar datas se fornecidas
    const dateFields = { approved_at };
    for (const [field, value] of Object.entries(dateFields)) {
      if (value && !isValidDate(value)) {
        return res.status(400).json({
          success: false,
          error: `${field} deve estar no formato YYYY-MM-DD`
        });
      }
    }

    // Validar status se fornecido
    const validStatuses = ['Pendente', 'Aprovado', 'Rejeitado', 'Em análise', 'Implementado'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido'
      });
    }

    // Verificar se o aprovador existe (se fornecido)
    if (approver_id) {
      const { data: approver, error: approverError } = await supabase
        .from('users')
        .select('id')
        .eq('id', approver_id)
        .single();

      if (approverError || !approver) {
        return res.status(400).json({
          success: false,
          error: 'Usuário aprovador não encontrado'
        });
      }
    }

    // Preparar dados para atualização
    const updateData: ProjectDeviationUpdate = {
      updated_at: new Date().toISOString()
    };

    // request field removed - using description only
    if (description !== undefined) updateData.description = description;
    if (evaluation_criteria !== undefined) updateData.evaluation_criteria = evaluation_criteria;
    if (impact_type !== undefined) updateData.impact_type = impact_type;
    if (generates_impediment !== undefined) updateData.generates_impediment = Boolean(generates_impediment);
    if (status !== undefined) updateData.status = status;
    if (approver_id !== undefined) updateData.approver_id = approver_id || null;
    if (approved_at !== undefined) updateData.approved_at = approved_at || null;
    // implementation_date mapped to updated_at automatically

    // Atualizar o desvio
    const { data: updatedDeviation, error: updateError } = await supabase
      .from('project_deviations')
      .update(updateData)
      .eq('id', deviationId)
      .eq('project_id', id)
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
      .single();

    if (updateError) {
      console.error('Erro ao atualizar desvio:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }

    return res.json({
      success: true,
      data: updatedDeviation,
      message: 'Desvio atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro na API updateProjectDeviation:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * DELETE /api/projects/[id]/deviations/[deviationId]
 * Remove um desvio específico
 */
export async function deleteProjectDeviation(req: Request, res: Response) {
  try {
    const { id, deviationId } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do projeto é obrigatório'
      });
    }

    if (!deviationId || typeof deviationId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do desvio é obrigatório'
      });
    }

    // Verificar se o desvio existe
    const { data: existingDeviation, error: deviationError } = await supabase
      .from('project_deviations')
      .select('id, project_id')
      .eq('id', deviationId)
      .eq('project_id', id)
      .single();

    if (deviationError || !existingDeviation) {
      return res.status(404).json({
        success: false,
        error: 'Desvio não encontrado'
      });
    }

    // Remover o desvio
    const { error: deleteError } = await supabase
      .from('project_deviations')
      .delete()
      .eq('id', deviationId)
      .eq('project_id', id);

    if (deleteError) {
      console.error('Erro ao remover desvio:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }

    return res.json({
      success: true,
      message: 'Desvio removido com sucesso'
    });

  } catch (error) {
    console.error('Erro na API deleteProjectDeviation:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * Função auxiliar para validar formato de data
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}