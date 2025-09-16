-- =====================================================
-- CORREÇÃO: Políticas da tabela team_members
-- Remove recursão infinita nas policies
-- =====================================================

-- Remover policies existentes que causam recursão
DROP POLICY IF EXISTS "Team members can view other members" ON public.team_members;
DROP POLICY IF EXISTS "Owners and admins can invite members" ON public.team_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.team_members;

-- Política simplificada para visualização - usuários podem ver apenas seus próprios registros
CREATE POLICY "Users can view their own team memberships" ON public.team_members
    FOR SELECT
    USING (user_id = auth.uid());

-- Política para inserção - apenas owners da equipe podem adicionar membros
CREATE POLICY "Team owners can invite members" ON public.team_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id
            AND t.owner_id = auth.uid()
            AND t.is_active = true
            AND t.deleted_at IS NULL
        )
        OR (
            -- Permitir auto-join se o usuário foi convidado
            team_members.user_id = auth.uid()
            AND team_members.status = 'pending'
        )
    );

-- Política para atualização - owners da equipe ou o próprio usuário
CREATE POLICY "Team owners and users can update memberships" ON public.team_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id
            AND t.owner_id = auth.uid()
            AND t.is_active = true
            AND t.deleted_at IS NULL
        )
        OR (
            -- Usuários podem atualizar seu próprio status
            team_members.user_id = auth.uid()
        )
    );

-- Política para exclusão - apenas owners da equipe
CREATE POLICY "Team owners can remove members" ON public.team_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id
            AND t.owner_id = auth.uid()
            AND t.is_active = true
            AND t.deleted_at IS NULL
        )
    );