-- =====================================================
-- MÓDULO 3: PROJECTS (Projetos)
-- =====================================================

-- Tabela de projetos
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
    
    -- Status e prioridade
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN (
        'planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived'
    )),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Datas importantes
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Configurações do projeto
    visibility VARCHAR(20) DEFAULT 'team' CHECK (visibility IN ('private', 'team', 'public')),
    settings JSONB DEFAULT '{
        "allow_external_collaborators": false,
        "require_task_approval": false,
        "auto_archive_completed_tasks": true,
        "notification_settings": {
            "task_updates": true,
            "deadline_reminders": true,
            "status_changes": true
        },
        "default_task_priority": "medium",
        "time_tracking_enabled": true
    }'::jsonb,
    
    -- Progresso e métricas
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    
    -- Metadados
    color VARCHAR(7) DEFAULT '#3B82F6',
    cover_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Auditoria
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date)
);

-- Tabela para colaboradores do projeto (além dos membros da equipe)
CREATE TABLE public.project_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) DEFAULT 'collaborator' CHECK (role IN ('owner', 'manager', 'collaborator', 'viewer')),
    permissions JSONB DEFAULT '{
        "can_create_tasks": true,
        "can_edit_tasks": true,
        "can_delete_tasks": false,
        "can_manage_stages": false,
        "can_invite_collaborators": false,
        "can_edit_project": false
    }'::jsonb,
    invited_by UUID REFERENCES public.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraint para evitar duplicatas
    UNIQUE(project_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_projects_team ON public.projects(team_id);
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_priority ON public.projects(priority);
CREATE INDEX idx_projects_due_date ON public.projects(due_date);
CREATE INDEX idx_projects_active ON public.projects(is_active) WHERE is_active = true;
CREATE INDEX idx_projects_deleted ON public.projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_tags ON public.projects USING GIN(tags);
CREATE INDEX idx_projects_search ON public.projects USING GIN(to_tsvector('portuguese', name || ' ' || COALESCE(description, '')));

CREATE INDEX idx_project_collaborators_project ON public.project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user ON public.project_collaborators(user_id);
CREATE INDEX idx_project_collaborators_role ON public.project_collaborators(role);
CREATE INDEX idx_project_collaborators_status ON public.project_collaborators(status);

-- Triggers para updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_collaborators_updated_at
    BEFORE UPDATE ON public.project_collaborators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar progresso automaticamente
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar contadores e progresso do projeto
    UPDATE public.projects
    SET 
        total_tasks = (
            SELECT COUNT(*)
            FROM public.tasks t
            WHERE t.project_id = COALESCE(NEW.project_id, OLD.project_id)
            AND t.deleted_at IS NULL
        ),
        completed_tasks = (
            SELECT COUNT(*)
            FROM public.tasks t
            JOIN public.stages s ON t.stage_id = s.id
            WHERE t.project_id = COALESCE(NEW.project_id, OLD.project_id)
            AND s.is_completed = true
            AND t.deleted_at IS NULL
        )
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    -- Atualizar percentage baseado nos contadores
    UPDATE public.projects
    SET progress_percentage = CASE
        WHEN total_tasks = 0 THEN 0
        ELSE ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100)
    END
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Políticas para PROJECTS
-- Membros da equipe podem ver projetos da equipe
CREATE POLICY "Team members can view team projects" ON public.projects
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = projects.team_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
        OR EXISTS (
            -- Ou colaboradores diretos do projeto
            SELECT 1 FROM public.project_collaborators pc
            WHERE pc.project_id = projects.id
            AND pc.user_id = auth.uid()
            AND pc.status = 'active'
            AND pc.deleted_at IS NULL
        )
    );

-- Membros da equipe com permissão podem criar projetos
CREATE POLICY "Team members can create projects" ON public.projects
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = projects.team_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
            AND (
                tm.role IN ('owner', 'admin')
                OR (tm.permissions->>'can_create_projects')::boolean = true
            )
        )
        AND auth.uid() = owner_id
    );

-- Owners, managers e admins da equipe podem atualizar projetos
CREATE POLICY "Authorized users can update projects" ON public.projects
    FOR UPDATE
    USING (
        -- Owner do projeto
        owner_id = auth.uid()
        OR EXISTS (
            -- Ou admin/owner da equipe
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = projects.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
        OR EXISTS (
            -- Ou manager do projeto
            SELECT 1 FROM public.project_collaborators pc
            WHERE pc.project_id = projects.id
            AND pc.user_id = auth.uid()
            AND pc.role = 'manager'
            AND pc.status = 'active'
            AND pc.deleted_at IS NULL
        )
    );

-- Apenas owners podem deletar projetos
CREATE POLICY "Only owners can delete projects" ON public.projects
    FOR DELETE
    USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = projects.team_id
            AND tm.user_id = auth.uid()
            AND tm.role = 'owner'
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
    );

-- Políticas para PROJECT_COLLABORATORS
-- Colaboradores podem ver outros colaboradores do mesmo projeto
CREATE POLICY "Project collaborators can view other collaborators" ON public.project_collaborators
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.team_members tm ON p.team_id = tm.team_id
            WHERE p.id = project_collaborators.project_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
        OR EXISTS (
            SELECT 1 FROM public.project_collaborators pc
            WHERE pc.project_id = project_collaborators.project_id
            AND pc.user_id = auth.uid()
            AND pc.status = 'active'
            AND pc.deleted_at IS NULL
        )
    );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para criar projeto com owner automático
CREATE OR REPLACE FUNCTION public.create_project_with_owner(
    project_name VARCHAR(255),
    project_description TEXT,
    team_id UUID,
    start_date DATE DEFAULT NULL,
    due_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_project_id UUID;
BEGIN
    -- Criar o projeto
    INSERT INTO public.projects (name, description, team_id, owner_id, start_date, due_date)
    VALUES (project_name, project_description, team_id, auth.uid(), start_date, due_date)
    RETURNING id INTO new_project_id;
    
    -- Adicionar o criador como owner
    INSERT INTO public.project_collaborators (project_id, user_id, role, status, joined_at)
    VALUES (new_project_id, auth.uid(), 'owner', 'active', NOW());
    
    RETURN new_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar projetos com filtros
CREATE OR REPLACE FUNCTION public.search_projects(
    search_term TEXT DEFAULT NULL,
    team_filter UUID DEFAULT NULL,
    status_filter VARCHAR(20) DEFAULT NULL,
    priority_filter VARCHAR(10) DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    status VARCHAR,
    priority VARCHAR,
    progress_percentage INTEGER,
    due_date DATE,
    owner_name VARCHAR,
    team_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.priority,
        p.progress_percentage,
        p.due_date,
        u.full_name as owner_name,
        t.name as team_name
    FROM public.projects p
    JOIN public.users u ON p.owner_id = u.id
    JOIN public.teams t ON p.team_id = t.id
    WHERE 
        p.deleted_at IS NULL
        AND p.is_active = true
        AND (search_term IS NULL OR p.name ILIKE '%' || search_term || '%' OR p.description ILIKE '%' || search_term || '%')
        AND (team_filter IS NULL OR p.team_id = team_filter)
        AND (status_filter IS NULL OR p.status = status_filter)
        AND (priority_filter IS NULL OR p.priority = priority_filter)
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
    ORDER BY 
        CASE p.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        p.due_date ASC NULLS LAST,
        p.updated_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE public.projects IS 'Projetos do sistema';
COMMENT ON COLUMN public.projects.id IS 'ID único do projeto';
COMMENT ON COLUMN public.projects.name IS 'Nome do projeto';
COMMENT ON COLUMN public.projects.description IS 'Descrição detalhada do projeto';
COMMENT ON COLUMN public.projects.team_id IS 'ID da equipe proprietária';
COMMENT ON COLUMN public.projects.owner_id IS 'ID do proprietário do projeto';
COMMENT ON COLUMN public.projects.status IS 'Status atual do projeto';
COMMENT ON COLUMN public.projects.priority IS 'Prioridade do projeto';
COMMENT ON COLUMN public.projects.progress_percentage IS 'Percentual de progresso (0-100)';
COMMENT ON COLUMN public.projects.settings IS 'Configurações do projeto em JSON';

COMMENT ON TABLE public.project_collaborators IS 'Colaboradores específicos do projeto';
COMMENT ON COLUMN public.project_collaborators.project_id IS 'ID do projeto';
COMMENT ON COLUMN public.project_collaborators.user_id IS 'ID do colaborador';
COMMENT ON COLUMN public.project_collaborators.role IS 'Papel do colaborador no projeto';
COMMENT ON COLUMN public.project_collaborators.permissions IS 'Permissões específicas do colaborador';