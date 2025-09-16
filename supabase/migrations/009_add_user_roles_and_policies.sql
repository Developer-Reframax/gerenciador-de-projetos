-- =====================================================
-- MIGRAÇÃO: Adicionar roles de usuário e políticas RLS
-- =====================================================

-- Adicionar coluna role à tabela users
ALTER TABLE public.users 
ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'membro', 'user'));

-- Criar índice para performance
CREATE INDEX idx_users_role ON public.users(role);

-- Atualizar usuários existentes para ter role 'admin' (primeiro usuário será admin)
UPDATE public.users 
SET role = 'admin' 
WHERE id = (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1);

-- =====================================================
-- POLÍTICAS RLS PARA CRIAÇÃO DE USUÁRIOS
-- =====================================================

-- Política: Admins e editores podem inserir novos usuários
CREATE POLICY "Admins and editors can create users" ON public.users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'editor')
            AND u.is_active = true
        )
    );

-- Política: Admins e editores podem ver todos os usuários
CREATE POLICY "Admins and editors can view all users" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'editor')
            AND u.is_active = true
        )
    );

-- Política: Admins podem atualizar qualquer usuário
CREATE POLICY "Admins can update any user" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
            AND u.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
            AND u.is_active = true
        )
    );

-- Política: Editores podem atualizar usuários não-admin
CREATE POLICY "Editors can update non-admin users" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'editor'
            AND u.is_active = true
        )
        AND role != 'admin'
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'editor'
            AND u.is_active = true
        )
        AND role != 'admin'
    );

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN public.users.role IS 'Papel do usuário no sistema (admin, editor, membro, user)';