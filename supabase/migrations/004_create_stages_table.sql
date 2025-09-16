-- =====================================================
-- MÓDULO 4: STAGES (Etapas/Colunas)
-- =====================================================

-- Tabela de etapas/colunas do projeto
CREATE TABLE public.stages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configurações visuais
    color VARCHAR(7) DEFAULT '#6B7280',
    icon VARCHAR(50), -- Nome do ícone (ex: 'play', 'pause', 'check')
    
    -- Ordenação e comportamento
    position INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN DEFAULT false, -- Se tarefas nesta etapa são consideradas concluídas
    is_initial BOOLEAN DEFAULT false,   -- Se é a etapa inicial para novas tarefas
    
    -- Limites e regras
    task_limit INTEGER, -- Limite de tarefas nesta etapa (WIP limit)
    settings JSONB DEFAULT '{
        "auto_assign": false,
        "require_approval_to_move": false,
        "notify_on_task_added": true,
        "allow_external_tasks": true,
        "time_tracking_required": false
    }'::jsonb,
    
    -- Auditoria
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT unique_stage_position_per_project UNIQUE(project_id, position),
    CONSTRAINT valid_task_limit CHECK (task_limit IS NULL OR task_limit > 0)
);

-- Índices para performance
CREATE INDEX idx_stages_project ON public.stages(project_id);
CREATE INDEX idx_stages_position ON public.stages(project_id, position);
CREATE INDEX idx_stages_completed ON public.stages(is_completed);
CREATE INDEX idx_stages_initial ON public.stages(is_initial);
CREATE INDEX idx_stages_deleted ON public.stages(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_stages_updated_at
    BEFORE UPDATE ON public.stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para reordenar etapas automaticamente
CREATE OR REPLACE FUNCTION reorder_stages_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Se position não foi especificada, colocar no final
    IF NEW.position IS NULL OR NEW.position = 0 THEN
        SELECT COALESCE(MAX(position), 0) + 1
        INTO NEW.position
        FROM public.stages
        WHERE project_id = NEW.project_id
        AND deleted_at IS NULL;
    ELSE
        -- Mover outras etapas para frente se necessário
        UPDATE public.stages
        SET position = position + 1
        WHERE project_id = NEW.project_id
        AND position >= NEW.position
        AND id != NEW.id
        AND deleted_at IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reorder_stages_on_insert
    BEFORE INSERT ON public.stages
    FOR EACH ROW
    EXECUTE FUNCTION reorder_stages_on_insert();

-- Função para reordenar etapas na atualização
CREATE OR REPLACE FUNCTION reorder_stages_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a posição mudou
    IF OLD.position != NEW.position THEN
        -- Se movendo para frente
        IF NEW.position > OLD.position THEN
            UPDATE public.stages
            SET position = position - 1
            WHERE project_id = NEW.project_id
            AND position > OLD.position
            AND position <= NEW.position
            AND id != NEW.id
            AND deleted_at IS NULL;
        -- Se movendo para trás
        ELSE
            UPDATE public.stages
            SET position = position + 1
            WHERE project_id = NEW.project_id
            AND position >= NEW.position
            AND position < OLD.position
            AND id != NEW.id
            AND deleted_at IS NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reorder_stages_on_update
    BEFORE UPDATE ON public.stages
    FOR EACH ROW
    EXECUTE FUNCTION reorder_stages_on_update();

-- Função para criar etapas padrão para novos projetos
CREATE OR REPLACE FUNCTION create_default_stages_for_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar etapas padrão para o novo projeto
    INSERT INTO public.stages (project_id, name, description, color, position, is_initial, is_completed, created_by)
    VALUES 
        (NEW.id, 'A Fazer', 'Tarefas que ainda não foram iniciadas', '#EF4444', 1, true, false, NEW.owner_id),
        (NEW.id, 'Em Progresso', 'Tarefas que estão sendo executadas', '#F59E0B', 2, false, false, NEW.owner_id),
        (NEW.id, 'Em Revisão', 'Tarefas aguardando revisão ou aprovação', '#8B5CF6', 3, false, false, NEW.owner_id),
        (NEW.id, 'Concluído', 'Tarefas finalizadas', '#10B981', 4, false, true, NEW.owner_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_stages
    AFTER INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION create_default_stages_for_project();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS na tabela
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver etapas de projetos que têm acesso
CREATE POLICY "Users can view stages of accessible projects" ON public.stages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.team_members tm ON p.team_id = tm.team_id
            WHERE p.id = stages.project_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.project_collaborators pc ON p.id = pc.project_id
            WHERE p.id = stages.project_id
            AND pc.user_id = auth.uid()
            AND pc.status = 'active'
            AND pc.deleted_at IS NULL
        )
    );

-- Política: Managers e owners podem criar etapas
CREATE POLICY "Managers can create stages" ON public.stages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = stages.project_id
            AND (
                p.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.team_members tm
                    WHERE tm.team_id = p.team_id
                    AND tm.user_id = auth.uid()
                    AND tm.role IN ('owner', 'admin')
                    AND tm.status = 'active'
                    AND tm.deleted_at IS NULL
                )
                OR EXISTS (
                    SELECT 1 FROM public.project_collaborators pc
                    WHERE pc.project_id = p.id
                    AND pc.user_id = auth.uid()
                    AND pc.role IN ('owner', 'manager')
                    AND pc.status = 'active'
                    AND pc.deleted_at IS NULL
                    AND (pc.permissions->>'can_manage_stages')::boolean = true
                )
            )
        )
    );

-- Política: Managers e owners podem atualizar etapas
CREATE POLICY "Managers can update stages" ON public.stages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = stages.project_id
            AND (
                p.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.team_members tm
                    WHERE tm.team_id = p.team_id
                    AND tm.user_id = auth.uid()
                    AND tm.role IN ('owner', 'admin')
                    AND tm.status = 'active'
                    AND tm.deleted_at IS NULL
                )
                OR EXISTS (
                    SELECT 1 FROM public.project_collaborators pc
                    WHERE pc.project_id = p.id
                    AND pc.user_id = auth.uid()
                    AND pc.role IN ('owner', 'manager')
                    AND pc.status = 'active'
                    AND pc.deleted_at IS NULL
                    AND (pc.permissions->>'can_manage_stages')::boolean = true
                )
            )
        )
    );

-- Política: Apenas owners podem deletar etapas
CREATE POLICY "Only owners can delete stages" ON public.stages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = stages.project_id
            AND (
                p.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.team_members tm
                    WHERE tm.team_id = p.team_id
                    AND tm.user_id = auth.uid()
                    AND tm.role = 'owner'
                    AND tm.status = 'active'
                    AND tm.deleted_at IS NULL
                )
            )
        )
    );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter etapas de um projeto ordenadas
CREATE OR REPLACE FUNCTION public.get_project_stages(project_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    color VARCHAR,
    icon VARCHAR,
    position INTEGER,
    is_completed BOOLEAN,
    is_initial BOOLEAN,
    task_count BIGINT,
    task_limit INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description,
        s.color,
        s.icon,
        s.position,
        s.is_completed,
        s.is_initial,
        COUNT(t.id) as task_count,
        s.task_limit
    FROM public.stages s
    LEFT JOIN public.tasks t ON s.id = t.stage_id AND t.deleted_at IS NULL
    WHERE s.project_id = project_uuid
    AND s.deleted_at IS NULL
    GROUP BY s.id, s.name, s.description, s.color, s.icon, s.position, s.is_completed, s.is_initial, s.task_limit
    ORDER BY s.position ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para mover etapa para nova posição
CREATE OR REPLACE FUNCTION public.move_stage_to_position(
    stage_uuid UUID,
    new_position INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.stages
    SET position = new_position
    WHERE id = stage_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para duplicar etapas de um projeto modelo
CREATE OR REPLACE FUNCTION public.copy_stages_from_template(
    source_project_id UUID,
    target_project_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    stages_copied INTEGER := 0;
BEGIN
    INSERT INTO public.stages (
        project_id, name, description, color, icon, position, 
        is_completed, is_initial, task_limit, settings, created_by
    )
    SELECT 
        target_project_id,
        name,
        description,
        color,
        icon,
        position,
        is_completed,
        is_initial,
        task_limit,
        settings,
        auth.uid()
    FROM public.stages
    WHERE project_id = source_project_id
    AND deleted_at IS NULL
    ORDER BY position;
    
    GET DIAGNOSTICS stages_copied = ROW_COUNT;
    RETURN stages_copied;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar limite de tarefas em uma etapa
CREATE OR REPLACE FUNCTION public.check_stage_task_limit(
    stage_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    stage_limit INTEGER;
BEGIN
    SELECT 
        COUNT(t.id),
        s.task_limit
    INTO current_count, stage_limit
    FROM public.stages s
    LEFT JOIN public.tasks t ON s.id = t.stage_id AND t.deleted_at IS NULL
    WHERE s.id = stage_uuid
    GROUP BY s.task_limit;
    
    -- Se não há limite definido, sempre permitir
    IF stage_limit IS NULL THEN
        RETURN true;
    END IF;
    
    -- Verificar se ainda há espaço
    RETURN current_count < stage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS DA TABELA
-- =====================================================

COMMENT ON TABLE public.stages IS 'Etapas/colunas do fluxo de trabalho dos projetos';
COMMENT ON COLUMN public.stages.id IS 'ID único da etapa';
COMMENT ON COLUMN public.stages.project_id IS 'ID do projeto proprietário';
COMMENT ON COLUMN public.stages.name IS 'Nome da etapa (ex: To Do, In Progress, Done)';
COMMENT ON COLUMN public.stages.description IS 'Descrição da etapa';
COMMENT ON COLUMN public.stages.color IS 'Cor da etapa em hexadecimal';
COMMENT ON COLUMN public.stages.icon IS 'Ícone da etapa';
COMMENT ON COLUMN public.stages.position IS 'Posição da etapa no fluxo (ordem)';
COMMENT ON COLUMN public.stages.is_completed IS 'Se tarefas nesta etapa são consideradas concluídas';
COMMENT ON COLUMN public.stages.is_initial IS 'Se é a etapa inicial para novas tarefas';
COMMENT ON COLUMN public.stages.task_limit IS 'Limite máximo de tarefas nesta etapa (WIP limit)';
COMMENT ON COLUMN public.stages.settings IS 'Configurações específicas da etapa em JSON';