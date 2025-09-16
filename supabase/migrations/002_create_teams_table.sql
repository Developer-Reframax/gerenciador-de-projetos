-- =====================================================
-- MÓDULO 2: TEAMS (Equipes)
-- =====================================================

-- Tabela de equipes
CREATE TABLE public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Cor em hexadecimal
    settings JSONB DEFAULT '{
        "allow_public_projects": false,
        "require_approval_for_members": true,
        "default_project_visibility": "team",
        "allow_external_sharing": false
    }'::jsonb,
    owner_id UUID REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabela intermediária para membros da equipe (relacionamento N:N)
CREATE TABLE public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{
        "can_create_projects": true,
        "can_invite_members": false,
        "can_manage_team": false,
        "can_delete_projects": false
    }'::jsonb,
    invited_by UUID REFERENCES public.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraint para evitar duplicatas
    UNIQUE(team_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_teams_owner ON public.teams(owner_id);
CREATE INDEX idx_teams_active ON public.teams(is_active) WHERE is_active = true;
CREATE INDEX idx_teams_deleted ON public.teams(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_teams_name ON public.teams(name);

CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_role ON public.team_members(role);
CREATE INDEX idx_team_members_status ON public.team_members(status);
CREATE INDEX idx_team_members_active ON public.team_members(team_id, user_id) WHERE deleted_at IS NULL;

-- Triggers para updated_at
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Políticas para TEAMS
-- Usuários podem ver equipes das quais são membros
CREATE POLICY "Users can view their teams" ON public.teams
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = teams.id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
    );

-- Apenas owners podem criar equipes
CREATE POLICY "Users can create teams" ON public.teams
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Owners e admins podem atualizar equipes
CREATE POLICY "Owners and admins can update teams" ON public.teams
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = teams.id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = teams.id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
    );

-- Apenas owners podem deletar equipes
CREATE POLICY "Only owners can delete teams" ON public.teams
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = teams.id
            AND tm.user_id = auth.uid()
            AND tm.role = 'owner'
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
    );

-- Políticas para TEAM_MEMBERS
-- Membros podem ver outros membros da mesma equipe
CREATE POLICY "Team members can view other members" ON public.team_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
    );

-- Owners e admins podem convidar membros
CREATE POLICY "Owners and admins can invite members" ON public.team_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
        OR (
            -- Permitir auto-join se o usuário foi convidado
            team_members.user_id = auth.uid()
            AND team_members.status = 'pending'
        )
    );

-- Owners e admins podem atualizar membros
CREATE POLICY "Owners and admins can update members" ON public.team_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
        )
        OR (
            -- Usuários podem atualizar seu próprio status (aceitar convite)
            team_members.user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para criar equipe com owner automático
CREATE OR REPLACE FUNCTION public.create_team_with_owner(
    team_name VARCHAR(255),
    team_description TEXT DEFAULT NULL,
    team_color VARCHAR(7) DEFAULT '#3B82F6'
)
RETURNS UUID AS $$
DECLARE
    new_team_id UUID;
BEGIN
    -- Criar a equipe
    INSERT INTO public.teams (name, description, color, owner_id)
    VALUES (team_name, team_description, team_color, auth.uid())
    RETURNING id INTO new_team_id;
    
    -- Adicionar o criador como owner
    INSERT INTO public.team_members (team_id, user_id, role, status, joined_at)
    VALUES (new_team_id, auth.uid(), 'owner', 'active', NOW());
    
    RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para convidar usuário para equipe
CREATE OR REPLACE FUNCTION public.invite_user_to_team(
    team_id UUID,
    user_email VARCHAR(255),
    member_role VARCHAR(20) DEFAULT 'member'
)
RETURNS UUID AS $$
DECLARE
    target_user_id UUID;
    invitation_id UUID;
BEGIN
    -- Verificar se o usuário existe
    SELECT id INTO target_user_id
    FROM public.users
    WHERE email = user_email AND is_active = true AND deleted_at IS NULL;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado: %', user_email;
    END IF;
    
    -- Verificar se já é membro
    IF EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = invite_user_to_team.team_id
        AND tm.user_id = target_user_id
        AND tm.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Usuário já é membro desta equipe';
    END IF;
    
    -- Criar convite
    INSERT INTO public.team_members (team_id, user_id, role, invited_by, status)
    VALUES (invite_user_to_team.team_id, target_user_id, member_role, auth.uid(), 'pending')
    RETURNING id INTO invitation_id;
    
    RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para aceitar convite
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.team_members
    SET status = 'active', joined_at = NOW()
    WHERE id = invitation_id
    AND user_id = auth.uid()
    AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE public.teams IS 'Equipes/organizações do sistema';
COMMENT ON COLUMN public.teams.id IS 'ID único da equipe';
COMMENT ON COLUMN public.teams.name IS 'Nome da equipe';
COMMENT ON COLUMN public.teams.description IS 'Descrição da equipe';
COMMENT ON COLUMN public.teams.avatar_url IS 'URL do avatar/logo da equipe';
COMMENT ON COLUMN public.teams.color IS 'Cor da equipe em hexadecimal';
COMMENT ON COLUMN public.teams.settings IS 'Configurações da equipe em JSON';
COMMENT ON COLUMN public.teams.owner_id IS 'ID do proprietário da equipe';

COMMENT ON TABLE public.team_members IS 'Membros das equipes (relacionamento N:N)';
COMMENT ON COLUMN public.team_members.team_id IS 'ID da equipe';
COMMENT ON COLUMN public.team_members.user_id IS 'ID do usuário';
COMMENT ON COLUMN public.team_members.role IS 'Papel do usuário na equipe';
COMMENT ON COLUMN public.team_members.permissions IS 'Permissões específicas do membro';
COMMENT ON COLUMN public.team_members.invited_by IS 'Quem convidou este membro';
COMMENT ON COLUMN public.team_members.status IS 'Status do membro (pending, active, etc.)';