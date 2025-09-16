-- =====================================================
-- MÓDULO 1: USERS (Usuários)
-- =====================================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários (estende auth.users do Supabase)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'pt-BR',
    theme VARCHAR(20) DEFAULT 'light',
    notification_preferences JSONB DEFAULT '{
        "email_notifications": true,
        "push_notifications": true,
        "task_assignments": true,
        "project_updates": true,
        "comments": true
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_active ON public.users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_deleted ON public.users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_last_seen ON public.users(last_seen_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS na tabela
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Política: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política: Usuários podem ver perfis básicos de outros usuários (será refinada após criação das equipes)
CREATE POLICY "Users can view basic profiles" ON public.users
    FOR SELECT
    USING (
        -- Permite ver perfis básicos de usuários ativos
        is_active = true AND deleted_at IS NULL
    );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para buscar usuários por email (para convites)
CREATE OR REPLACE FUNCTION public.search_users_by_email(search_email TEXT)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    full_name VARCHAR,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, u.full_name, u.avatar_url
    FROM public.users u
    WHERE u.email ILIKE '%' || search_email || '%'
    AND u.is_active = true
    AND u.deleted_at IS NULL
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar last_seen_at
CREATE OR REPLACE FUNCTION public.update_user_last_seen()
RETURNS VOID AS $$
BEGIN
    UPDATE public.users
    SET last_seen_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS DA TABELA
-- =====================================================

COMMENT ON TABLE public.users IS 'Perfis de usuários do sistema';
COMMENT ON COLUMN public.users.id IS 'ID do usuário (referencia auth.users)';
COMMENT ON COLUMN public.users.email IS 'Email do usuário';
COMMENT ON COLUMN public.users.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN public.users.avatar_url IS 'URL do avatar do usuário';
COMMENT ON COLUMN public.users.bio IS 'Biografia/descrição do usuário';
COMMENT ON COLUMN public.users.timezone IS 'Fuso horário do usuário';
COMMENT ON COLUMN public.users.language IS 'Idioma preferido do usuário';
COMMENT ON COLUMN public.users.theme IS 'Tema da interface (light/dark)';
COMMENT ON COLUMN public.users.notification_preferences IS 'Preferências de notificação em JSON';
COMMENT ON COLUMN public.users.is_active IS 'Se o usuário está ativo no sistema';
COMMENT ON COLUMN public.users.last_seen_at IS 'Última vez que o usuário foi visto online';
COMMENT ON COLUMN public.users.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.users.updated_at IS 'Data da última atualização';
COMMENT ON COLUMN public.users.deleted_at IS 'Data de exclusão lógica (soft delete)';