-- =====================================================
-- FUNÇÃO RPC PARA REORDENAR TAREFAS
-- =====================================================

-- Função para reordenar tarefas dentro do mesmo estágio
CREATE OR REPLACE FUNCTION public.reorder_tasks_in_stage(
    p_task_id UUID,
    p_new_position INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_current_position INTEGER;
    v_stage_id UUID;
    v_project_id UUID;
    v_max_position INTEGER;
    v_final_position INTEGER;
    task_record RECORD;
BEGIN
    -- Verificar se a tarefa existe e obter informações
    SELECT position, stage_id, project_id
    INTO v_current_position, v_stage_id, v_project_id
    FROM public.tasks
    WHERE id = p_task_id AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tarefa não encontrada'
        );
    END IF;
    
    -- Obter a posição máxima no estágio
    SELECT COALESCE(MAX(position), -1)
    INTO v_max_position
    FROM public.tasks
    WHERE stage_id = v_stage_id AND deleted_at IS NULL;
    
    -- Calcular a posição final
    v_final_position := LEAST(p_new_position, v_max_position);
    
    -- Se a posição não mudou, retornar sucesso
    IF v_current_position = v_final_position THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Posição não alterada'
        );
    END IF;
    
    -- Reordenar tarefas baseado na direção do movimento
    IF v_current_position < v_final_position THEN
        -- Movendo para baixo: mover tarefas para cima
        UPDATE public.tasks
        SET position = position - 1
        WHERE stage_id = v_stage_id
        AND position > v_current_position
        AND position <= v_final_position
        AND id != p_task_id
        AND deleted_at IS NULL;
    ELSE
        -- Movendo para cima: mover tarefas para baixo
        UPDATE public.tasks
        SET position = position + 1
        WHERE stage_id = v_stage_id
        AND position >= v_final_position
        AND position < v_current_position
        AND id != p_task_id
        AND deleted_at IS NULL;
    END IF;
    
    -- Atualizar a posição da tarefa
    UPDATE public.tasks
    SET position = v_final_position
    WHERE id = p_task_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Tarefa reordenada com sucesso',
        'task_id', p_task_id,
        'old_position', v_current_position,
        'new_position', v_final_position
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tarefas de um estágio ordenadas por posição
CREATE OR REPLACE FUNCTION public.get_stage_tasks_ordered(
    p_stage_id UUID
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    status task_status,
    priority task_priority,
    assignee_id UUID,
    estimated_hours DECIMAL,
    "position" INTEGER,
    stage_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.assignee_id,
        t.estimated_hours,
        t."position",
        t.stage_id,
        t.created_at
    FROM public.tasks t
    WHERE t.stage_id = p_stage_id
    AND t.deleted_at IS NULL
    ORDER BY t."position" ASC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON FUNCTION public.reorder_tasks_in_stage(UUID, INTEGER) IS 'Reordena uma tarefa dentro do mesmo estágio';
COMMENT ON FUNCTION public.get_stage_tasks_ordered(UUID) IS 'Obtém tarefas de um estágio ordenadas por posição';