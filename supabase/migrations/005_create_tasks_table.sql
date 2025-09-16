-- =====================================================
-- MÓDULO 5: TASKS (Tarefas)
-- =====================================================

-- Enum para prioridades
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Enum para status das tarefas
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'blocked', 'completed', 'cancelled');

-- Tabela principal de tarefas
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    stage_id UUID REFERENCES public.stages(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE, -- Para subtarefas
    
    -- Informações básicas
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Classificação e organização
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'todo',
    tags TEXT[] DEFAULT '{}',
    
    -- Pessoas envolvidas
    assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
    
    -- Datas e prazos
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Estimativas e tempo
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2) DEFAULT 0,
    story_points INTEGER,
    
    -- Ordenação e posicionamento
    position INTEGER DEFAULT 0,
    
    -- Configurações e metadados
    settings JSONB DEFAULT '{
        "notifications_enabled": true,
        "time_tracking_enabled": false,
        "require_approval_to_complete": false,
        "auto_assign_on_start": false,
        "block_subtasks_completion": true
    }'::jsonb,
    
    -- Campos customizados (flexibilidade para diferentes tipos de projeto)
    custom_fields JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date),
    CONSTRAINT valid_hours CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
    CONSTRAINT valid_actual_hours CHECK (actual_hours >= 0),
    CONSTRAINT valid_story_points CHECK (story_points IS NULL OR story_points > 0),
    CONSTRAINT no_self_parent CHECK (id != parent_task_id)
);

-- Tabela para relacionamento many-to-many entre tarefas e usuários (watchers/followers)
CREATE TABLE public.task_watchers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Configurações de notificação
    notify_on_update BOOLEAN DEFAULT true,
    notify_on_comment BOOLEAN DEFAULT true,
    notify_on_status_change BOOLEAN DEFAULT true,
    notify_on_assignment BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(task_id, user_id)
);

-- Tabela para dependências entre tarefas
CREATE TABLE public.task_dependencies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    predecessor_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    successor_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    
    -- Tipo de dependência
    dependency_type VARCHAR(50) DEFAULT 'finish_to_start' CHECK (
        dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')
    ),
    
    -- Lag time em dias
    lag_days INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    UNIQUE(predecessor_id, successor_id),
    CONSTRAINT no_self_dependency CHECK (predecessor_id != successor_id)
);

-- Tabela para histórico de mudanças de status
CREATE TABLE public.task_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    
    from_status task_status,
    to_status task_status NOT NULL,
    from_stage_id UUID REFERENCES public.stages(id) ON DELETE SET NULL,
    to_stage_id UUID REFERENCES public.stages(id) ON DELETE SET NULL,
    
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Motivo da mudança
    reason TEXT,
    
    -- Tempo gasto neste status (calculado automaticamente)
    time_in_previous_status INTERVAL
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices principais
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_stage ON public.tasks(stage_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_reporter ON public.tasks(reporter_id);
CREATE INDEX idx_tasks_parent ON public.tasks(parent_task_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_deleted ON public.tasks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_position ON public.tasks(stage_id, position);

-- Índices compostos para queries comuns
CREATE INDEX idx_tasks_project_status ON public.tasks(project_id, status);
CREATE INDEX idx_tasks_assignee_status ON public.tasks(assignee_id, status) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_tasks_stage_position ON public.tasks(stage_id, position) WHERE stage_id IS NOT NULL;

-- Índices para busca por tags
CREATE INDEX idx_tasks_tags ON public.tasks USING GIN(tags);

-- Índices para campos customizados
CREATE INDEX idx_tasks_custom_fields ON public.tasks USING GIN(custom_fields);

-- Índices para tabelas relacionadas
CREATE INDEX idx_task_watchers_task ON public.task_watchers(task_id);
CREATE INDEX idx_task_watchers_user ON public.task_watchers(user_id);
CREATE INDEX idx_task_dependencies_predecessor ON public.task_dependencies(predecessor_id);
CREATE INDEX idx_task_dependencies_successor ON public.task_dependencies(successor_id);
CREATE INDEX idx_task_status_history_task ON public.task_status_history(task_id);
CREATE INDEX idx_task_status_history_changed_at ON public.task_status_history(changed_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para registrar mudanças de status
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
DECLARE
    previous_status_time INTERVAL;
BEGIN
    -- Só registrar se o status ou stage mudou
    IF (OLD.status != NEW.status) OR (OLD.stage_id != NEW.stage_id) THEN
        
        -- Calcular tempo no status anterior
        SELECT 
            COALESCE(NOW() - MAX(changed_at), INTERVAL '0')
        INTO previous_status_time
        FROM public.task_status_history
        WHERE task_id = NEW.id;
        
        -- Inserir registro no histórico
        INSERT INTO public.task_status_history (
            task_id, from_status, to_status, from_stage_id, to_stage_id,
            changed_by, time_in_previous_status
        ) VALUES (
            NEW.id, OLD.status, NEW.status, OLD.stage_id, NEW.stage_id,
            auth.uid(), previous_status_time
        );
        
        -- Atualizar completed_at se tarefa foi concluída
        IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
            NEW.completed_at = NOW();
        ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
            NEW.completed_at = NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_task_status_change
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_status_change();

-- Trigger para adicionar watchers automaticamente
CREATE OR REPLACE FUNCTION auto_add_task_watchers()
RETURNS TRIGGER AS $$
BEGIN
    -- Adicionar o reporter como watcher
    INSERT INTO public.task_watchers (task_id, user_id)
    VALUES (NEW.id, NEW.reporter_id)
    ON CONFLICT (task_id, user_id) DO NOTHING;
    
    -- Adicionar o assignee como watcher (se diferente do reporter)
    IF NEW.assignee_id IS NOT NULL AND NEW.assignee_id != NEW.reporter_id THEN
        INSERT INTO public.task_watchers (task_id, user_id)
        VALUES (NEW.id, NEW.assignee_id)
        ON CONFLICT (task_id, user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_add_task_watchers
    AFTER INSERT ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_task_watchers();

-- Trigger para atualizar watchers quando assignee muda
CREATE OR REPLACE FUNCTION update_task_watchers_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o assignee mudou, adicionar o novo como watcher
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
        IF NEW.assignee_id IS NOT NULL THEN
            INSERT INTO public.task_watchers (task_id, user_id)
            VALUES (NEW.id, NEW.assignee_id)
            ON CONFLICT (task_id, user_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_watchers_on_assignment
    AFTER UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_watchers_on_assignment();

-- Trigger para reordenar tarefas automaticamente
CREATE OR REPLACE FUNCTION reorder_tasks_on_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Se mudou de stage, colocar no final da nova stage
    IF OLD.stage_id IS DISTINCT FROM NEW.stage_id AND NEW.stage_id IS NOT NULL THEN
        SELECT COALESCE(MAX(position), 0) + 1
        INTO NEW.position
        FROM public.tasks
        WHERE stage_id = NEW.stage_id
        AND deleted_at IS NULL
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reorder_tasks_on_stage_change
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION reorder_tasks_on_stage_change();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas para tasks
CREATE POLICY "Users can view tasks of accessible projects" ON public.tasks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.team_members tm ON p.team_id = tm.team_id
            WHERE p.id = tasks.project_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.project_collaborators pc ON p.id = pc.project_id
            WHERE p.id = tasks.project_id
            AND pc.user_id = auth.uid()
            AND pc.status = 'active'
            AND pc.deleted_at IS NULL
        )
    );

CREATE POLICY "Users can create tasks in accessible projects" ON public.tasks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = tasks.project_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.team_members tm
                    WHERE tm.team_id = p.team_id
                    AND tm.user_id = auth.uid()
                    AND tm.status = 'active'
                    AND tm.deleted_at IS NULL
                )
                OR EXISTS (
                    SELECT 1 FROM public.project_collaborators pc
                    WHERE pc.project_id = p.id
                    AND pc.user_id = auth.uid()
                    AND pc.status = 'active'
                    AND pc.deleted_at IS NULL
                    AND (pc.permissions->>'can_create_tasks')::boolean = true
                )
            )
        )
    );

CREATE POLICY "Users can update their tasks or if have permission" ON public.tasks
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete tasks if have permission" ON public.tasks
    FOR DELETE
    USING (
        reporter_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = tasks.project_id
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
            )
        )
    );

-- Políticas para task_watchers
CREATE POLICY "Users can view watchers of accessible tasks" ON public.task_watchers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = task_watchers.task_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.team_members tm
                    WHERE tm.team_id = p.team_id
                    AND tm.user_id = auth.uid()
                    AND tm.status = 'active'
                    AND tm.deleted_at IS NULL
                )
                OR EXISTS (
                    SELECT 1 FROM public.project_collaborators pc
                    WHERE pc.project_id = p.id
                    AND pc.user_id = auth.uid()
                    AND pc.status = 'active'
                    AND pc.deleted_at IS NULL
                )
            )
        )
    );

CREATE POLICY "Users can manage their own watching status" ON public.task_watchers
    FOR ALL
    USING (user_id = auth.uid());

-- Políticas similares para outras tabelas relacionadas
CREATE POLICY "Users can view dependencies of accessible tasks" ON public.task_dependencies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE (t.id = task_dependencies.predecessor_id OR t.id = task_dependencies.successor_id)
            AND (
                EXISTS (
                    SELECT 1 FROM public.team_members tm
                    WHERE tm.team_id = p.team_id
                    AND tm.user_id = auth.uid()
                    AND tm.status = 'active'
                    AND tm.deleted_at IS NULL
                )
                OR EXISTS (
                    SELECT 1 FROM public.project_collaborators pc
                    WHERE pc.project_id = p.id
                    AND pc.user_id = auth.uid()
                    AND pc.status = 'active'
                    AND pc.deleted_at IS NULL
                )
            )
        )
    );

CREATE POLICY "Users can view status history of accessible tasks" ON public.task_status_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = task_status_history.task_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.team_members tm
                    WHERE tm.team_id = p.team_id
                    AND tm.user_id = auth.uid()
                    AND tm.status = 'active'
                    AND tm.deleted_at IS NULL
                )
                OR EXISTS (
                    SELECT 1 FROM public.project_collaborators pc
                    WHERE pc.project_id = p.id
                    AND pc.user_id = auth.uid()
                    AND pc.status = 'active'
                    AND pc.deleted_at IS NULL
                )
            )
        )
    );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter tarefas de um projeto com filtros
CREATE OR REPLACE FUNCTION public.get_project_tasks(
    project_uuid UUID,
    stage_uuid UUID DEFAULT NULL,
    assignee_uuid UUID DEFAULT NULL,
    task_status task_status DEFAULT NULL,
    search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    priority task_priority,
    status task_status,
    assignee_name TEXT,
    stage_name TEXT,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    subtask_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        u.full_name as assignee_name,
        s.name as stage_name,
        t.due_date,
        t.created_at,
        COUNT(st.id) as subtask_count
    FROM public.tasks t
    LEFT JOIN public.users u ON t.assignee_id = u.id
    LEFT JOIN public.stages s ON t.stage_id = s.id
    LEFT JOIN public.tasks st ON t.id = st.parent_task_id AND st.deleted_at IS NULL
    WHERE t.project_id = project_uuid
    AND t.deleted_at IS NULL
    AND (stage_uuid IS NULL OR t.stage_id = stage_uuid)
    AND (assignee_uuid IS NULL OR t.assignee_id = assignee_uuid)
    AND (task_status IS NULL OR t.status = task_status)
    AND (search_term IS NULL OR 
         t.title ILIKE '%' || search_term || '%' OR 
         t.description ILIKE '%' || search_term || '%')
    GROUP BY t.id, t.title, t.description, t.priority, t.status, u.full_name, s.name, t.due_date, t.created_at, t.position
    ORDER BY t.position ASC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para mover tarefa para nova posição
CREATE OR REPLACE FUNCTION public.move_task_to_position(
    task_uuid UUID,
    new_stage_id UUID,
    new_position INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.tasks
    SET stage_id = new_stage_id, position = new_position
    WHERE id = task_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de tarefas de um projeto
CREATE OR REPLACE FUNCTION public.get_project_task_stats(project_uuid UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    overdue_tasks BIGINT,
    tasks_by_priority JSONB,
    tasks_by_status JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'completed') as overdue_tasks,
        jsonb_object_agg(priority, priority_count) as tasks_by_priority,
        jsonb_object_agg(status, status_count) as tasks_by_status
    FROM (
        SELECT 
            priority,
            status,
            COUNT(*) OVER (PARTITION BY priority) as priority_count,
            COUNT(*) OVER (PARTITION BY status) as status_count
        FROM public.tasks
        WHERE project_id = project_uuid
        AND deleted_at IS NULL
    ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE public.tasks IS 'Tarefas dos projetos';
COMMENT ON COLUMN public.tasks.id IS 'ID único da tarefa';
COMMENT ON COLUMN public.tasks.project_id IS 'ID do projeto proprietário';
COMMENT ON COLUMN public.tasks.stage_id IS 'ID da etapa atual da tarefa';
COMMENT ON COLUMN public.tasks.parent_task_id IS 'ID da tarefa pai (para subtarefas)';
COMMENT ON COLUMN public.tasks.title IS 'Título da tarefa';
COMMENT ON COLUMN public.tasks.description IS 'Descrição detalhada da tarefa';
COMMENT ON COLUMN public.tasks.priority IS 'Prioridade da tarefa';
COMMENT ON COLUMN public.tasks.status IS 'Status atual da tarefa';
COMMENT ON COLUMN public.tasks.assignee_id IS 'ID do usuário responsável pela tarefa';
COMMENT ON COLUMN public.tasks.reporter_id IS 'ID do usuário que criou a tarefa';
COMMENT ON COLUMN public.tasks.estimated_hours IS 'Estimativa de horas para conclusão';
COMMENT ON COLUMN public.tasks.actual_hours IS 'Horas realmente gastas na tarefa';
COMMENT ON COLUMN public.tasks.story_points IS 'Pontos de história (metodologias ágeis)';

COMMENT ON TABLE public.task_watchers IS 'Usuários que acompanham uma tarefa';
COMMENT ON TABLE public.task_dependencies IS 'Dependências entre tarefas';
COMMENT ON TABLE public.task_status_history IS 'Histórico de mudanças de status das tarefas';