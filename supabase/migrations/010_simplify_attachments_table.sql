-- =====================================================
-- MIGRAÇÃO 10: SIMPLIFICAR TABELA ATTACHMENTS
-- =====================================================

-- Remover tabelas auxiliares complexas
DROP TABLE IF EXISTS public.attachment_thumbnails CASCADE;
DROP TABLE IF EXISTS public.attachment_versions CASCADE;
DROP TABLE IF EXISTS public.attachment_access_log CASCADE;

-- Remover a tabela attachments atual
DROP TABLE IF EXISTS public.attachments CASCADE;

-- Remover enums antigos
DROP TYPE IF EXISTS attachment_type CASCADE;
DROP TYPE IF EXISTS attachment_context CASCADE;

-- Criar enum simples para tipos de arquivo
CREATE TYPE file_type_enum AS ENUM (
    'image', 'document', 'video', 'audio', 'archive', 'code', 'other'
);

-- Criar tabela attachments simplificada
CREATE TABLE public.attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Referência ao projeto
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    
    -- Informações básicas do arquivo
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    file_type file_type_enum NOT NULL,
    
    -- Auditoria básica
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints básicos
    CONSTRAINT valid_file_size CHECK (file_size > 0)
);

-- Índices para performance
CREATE INDEX idx_attachments_project_id ON public.attachments(project_id);
CREATE INDEX idx_attachments_uploaded_by ON public.attachments(uploaded_by);
CREATE INDEX idx_attachments_created_at ON public.attachments(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attachments_updated_at 
    BEFORE UPDATE ON public.attachments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS RLS SIMPLIFICADAS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários autenticados podem ver anexos de projetos onde são membros
CREATE POLICY "Users can view attachments of their projects" ON public.attachments
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            -- Usuário é membro da equipe do projeto
            EXISTS (
                SELECT 1 FROM public.team_members tm
                JOIN public.projects p ON p.team_id = tm.team_id
                WHERE p.id = attachments.project_id 
                AND tm.user_id = auth.uid()
            )
            OR
            -- Usuário é o criador do projeto
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = attachments.project_id 
                AND p.created_by = auth.uid()
            )
        )
    );

-- Política para INSERT: usuários autenticados podem fazer upload em projetos onde são membros
CREATE POLICY "Users can upload attachments to their projects" ON public.attachments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        uploaded_by = auth.uid() AND (
            -- Usuário é membro da equipe do projeto
            EXISTS (
                SELECT 1 FROM public.team_members tm
                JOIN public.projects p ON p.team_id = tm.team_id
                WHERE p.id = attachments.project_id 
                AND tm.user_id = auth.uid()
            )
            OR
            -- Usuário é o criador do projeto
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = attachments.project_id 
                AND p.created_by = auth.uid()
            )
        )
    );

-- Política para DELETE: usuários podem deletar seus próprios anexos
CREATE POLICY "Users can delete their own attachments" ON public.attachments
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND uploaded_by = auth.uid()
    );

-- Política para UPDATE: usuários podem atualizar seus próprios anexos
CREATE POLICY "Users can update their own attachments" ON public.attachments
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND uploaded_by = auth.uid()
    );