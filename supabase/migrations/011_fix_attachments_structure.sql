-- =====================================================
-- MIGRAÇÃO 11: CORRIGIR ESTRUTURA DA TABELA ATTACHMENTS
-- =====================================================

-- Remover a tabela attachments atual
DROP TABLE IF EXISTS public.attachments CASCADE;

-- Remover enum antigo
DROP TYPE IF EXISTS file_type_enum CASCADE;

-- Criar tabela attachments com a estrutura correta para o código
CREATE TABLE public.attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Referência ao projeto
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    
    -- Referência ao usuário que fez upload
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Informações do arquivo
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    file_type TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_attachments_project_id ON public.attachments(project_id);
CREATE INDEX idx_attachments_user_id ON public.attachments(user_id);
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
-- POLÍTICAS RLS
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
            -- Usuário é o owner do projeto
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = attachments.project_id 
                AND p.owner_id = auth.uid()
            )
        )
    );

-- Política para INSERT: usuários autenticados podem fazer upload em projetos onde são membros
CREATE POLICY "Users can upload attachments to their projects" ON public.attachments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        user_id = auth.uid() AND (
            -- Usuário é membro da equipe do projeto
            EXISTS (
                SELECT 1 FROM public.team_members tm
                JOIN public.projects p ON p.team_id = tm.team_id
                WHERE p.id = attachments.project_id 
                AND tm.user_id = auth.uid()
            )
            OR
            -- Usuário é o owner do projeto
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = attachments.project_id 
                AND p.owner_id = auth.uid()
            )
        )
    );

-- Política para DELETE: usuários podem deletar seus próprios anexos
CREATE POLICY "Users can delete their own attachments" ON public.attachments
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND user_id = auth.uid()
    );

-- Política para UPDATE: usuários podem atualizar seus próprios anexos
CREATE POLICY "Users can update their own attachments" ON public.attachments
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND user_id = auth.uid()
    );

-- Conceder permissões para roles
GRANT ALL PRIVILEGES ON public.attachments TO authenticated;
GRANT SELECT ON public.attachments TO anon;