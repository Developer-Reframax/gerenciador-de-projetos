import { createServiceRoleClient } from '../../src/lib/supabase-server';
import type { MoveItemRequest, KanbanApiResponse, KanbanProject } from '../../shared/types/kanban';
import type { Database } from '../../src/types/database';

interface Request {
  body: MoveItemRequest | { moves: MoveItemRequest[] };
  headers: Record<string, string>;
  user?: { id: string };
}

interface Response {
  status(code: number): Response;
  json: (data: unknown) => Response;
}

const supabase = createServiceRoleClient();

/**
 * POST /api/kanban/move
 * Move um item (tarefa ou projeto) entre colunas do Kanban
 */
export async function moveKanbanItem(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      } as KanbanApiResponse<null>);
    }

    const body = req.body as MoveItemRequest;
    const {
      item_id,
      item_type,
      source_column,
      target_column,
      new_position,
      view_type
    } = body;

    // Validação dos parâmetros
    if (!item_id || !item_type || !source_column || !target_column || new_position === undefined || !view_type) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: item_id, item_type, source_column, target_column, new_position, view_type'
      } as KanbanApiResponse<null>);
    }

    if (!['task', 'project'].includes(item_type)) {
      return res.status(400).json({
        success: false,
        error: 'item_type deve ser "task" ou "project"'
      } as KanbanApiResponse<null>);
    }

    if (!['project', 'assignee', 'status'].includes(view_type)) {
      return res.status(400).json({
        success: false,
        error: 'view_type deve ser "project", "assignee" ou "status"'
      } as KanbanApiResponse<null>);
    }

    // Processar movimentação baseada no tipo de item e visualização
    if (item_type === 'task') {
      return await moveTask({
        item_id,
        target_column,
        new_position,
        view_type,
        user_id,
        res
      });
    } else {
      return await moveProject({
        item_id,
        target_column,
        user_id,
        res
      });
    }

  } catch (error) {
    console.error('Erro na API moveKanbanItem:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>);
  }
}

/**
 * Move uma tarefa entre colunas
 */
async function moveTask({
  item_id,
  target_column,
  new_position,
  view_type,
  user_id,
  res
}: {
  item_id: string;
  target_column: string;
  new_position: number;
  view_type: string;
  user_id: string;
  res: Response;
}) {
  // Verificar se a tarefa existe e se o usuário tem permissão
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(`
      *,
      projects!inner(
        team_id,
        teams!inner(
          team_members!inner(user_id)
        )
      )
    `)
    .eq('id', item_id)
    .eq('projects.teams.team_members.user_id', user_id)
    .single();

  if (taskError || !task) {
    return res.status(404).json({
      success: false,
      error: 'Tarefa não encontrada ou acesso negado'
    } as KanbanApiResponse<null>);
  }

  // Determinar o novo status baseado na visualização e coluna de destino
  let newStatus = target_column;

  if (view_type === 'assignee') {
    // Na visualização por responsável, a coluna representa o usuário
    newStatus = task.status; // Manter o status atual
  } else if (view_type === 'project') {
    // Na visualização por projeto, a coluna representa o status
    newStatus = target_column;
  }

  // Atualizar posições das outras tarefas
  if (view_type === 'project') {
    // Ajustar posições das tarefas no mesmo projeto e status
    await supabase.rpc('reorder_tasks', {
      task_id: item_id,
      new_stage_id: target_column,
      new_order_index: new_position
    });
  }

  // Atualizar a tarefa
  const updateData: Partial<Database['public']['Tables']['tasks']['Update']> = {
      position: new_position
    };

  if (newStatus !== task.status) {
    // Mapear in_review para review para compatibilidade com o banco
    const mappedStatus = newStatus === 'in_review' ? 'review' : newStatus;
    updateData.status = mappedStatus as Database['public']['Enums']['task_status'];
  }

  // Para view_type 'assignee', o target_column representa o novo responsável
        // mas não atualizamos assigned_to pois não existe na interface KanbanTask

  const { error: updateError } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', item_id);

  if (updateError) {
    console.error('Erro ao atualizar tarefa:', updateError);
    return res.status(500).json({
      success: false,
      error: 'Erro ao mover tarefa'
    } as KanbanApiResponse<null>);
  }

  return res.json({
    success: true,
    data: { message: 'Tarefa movida com sucesso' }
  } as KanbanApiResponse<{message: string}>);
}

/**
 * Move um projeto entre colunas
 */
async function moveProject({
  item_id,
  target_column,
  user_id,
  res
}: {
  item_id: string;
  target_column: string;
  user_id: string;
  res: Response;
}) {
  // Verificar se o projeto existe e se o usuário tem permissão
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(`
      *,
      teams!inner(
        team_members!inner(user_id)
      )
    `)
    .eq('id', item_id)
    .eq('teams.team_members.user_id', user_id)
    .single();

  if (projectError || !project) {
    return res.status(404).json({
      success: false,
      error: 'Projeto não encontrado ou acesso negado'
    } as KanbanApiResponse<null>);
  }

  // Na visualização por status, a coluna representa o status do projeto
  const validStatuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'] as const;
  
  // Validar se o status é válido
  if (!validStatuses.includes(target_column as typeof validStatuses[number])) {
    return res.status(400).json({
      success: false,
      error: 'Status de projeto inválido'
    } as KanbanApiResponse<null>);
  }

  const newStatus = target_column as typeof validStatuses[number];

  // Atualizar o projeto
  const updateData: Partial<KanbanProject> = {
    status: newStatus
  };

  // Se o projeto foi marcado como concluído, definir data de fim
  if (newStatus === 'completed' && !('end_date' in project && project.end_date)) {
    updateData.end_date = new Date().toISOString().split('T')[0];
  }

  const { error: updateError } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', item_id);

  if (updateError) {
    console.error('Erro ao atualizar projeto:', updateError);
    return res.status(500).json({
      success: false,
      error: 'Erro ao mover projeto'
    } as KanbanApiResponse<null>);
  }

  return res.json({
    success: true,
    data: { message: 'Projeto movido com sucesso' }
  } as KanbanApiResponse<{message: string}>);
}

/**
 * POST /api/kanban/move/batch
 * Move múltiplos itens de uma vez (para reorganização em lote)
 */
export async function batchMoveKanbanItems(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      } as KanbanApiResponse<null>);
    }

    const bodyWithMoves = req.body as { moves: MoveItemRequest[] };
    const moves: MoveItemRequest[] = bodyWithMoves.moves || [];

    if (!moves || !Array.isArray(moves) || moves.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array de movimentações é obrigatório'
      } as KanbanApiResponse<null>);
    }

    const results: Array<{item_id: string; success: boolean}> = [];
    const errors: Array<{item_id: string; error: string}> = [];

    // Processar cada movimentação
    for (const move of moves) {
      try {
        // Simular uma resposta para cada movimentação
        const mockRes = {
          status: (code: number) => ({ json: (data: unknown) => ({ code, data }) }),
          json: (data: unknown) => ({ code: 200, data })
        } as unknown as Response;

        if (move.item_type === 'task') {
          await moveTask({ ...move, user_id, res: mockRes });
        } else {
          await moveProject({ ...move, user_id, res: mockRes });
        }

        results.push({ item_id: move.item_id, success: true });
      } catch (error) {
        console.error(`Erro ao mover item ${move.item_id}:`, error);
        errors.push({ item_id: move.item_id, error: 'Erro ao mover item' });
      }
    }

    return res.json({
      success: errors.length === 0,
      data: {
        successful_moves: results.length,
        failed_moves: errors.length,
        results,
        errors
      }
    } as KanbanApiResponse<{successful_moves: number; failed_moves: number; results: Array<{item_id: string; success: boolean}>; errors: Array<{item_id: string; error: string}>}>);

  } catch (error) {
    console.error('Erro na API batchMoveKanbanItems:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    } as KanbanApiResponse<null>);
  }
}