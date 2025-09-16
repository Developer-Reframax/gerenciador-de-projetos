-- =====================================================
-- MÓDULO 6: ATTACHMENTS (Anexos)
-- =====================================================

-- Enum para tipos de anexos
CREATE TYPE attachment_type AS ENUM (
    'image', 'document', 'video', 'audio', 'archive', 'code', 'other'
);

-- Enum para contextos onde o anexo pode ser usado
CREATE TYPE attachment_context AS ENUM (
    'task', 'project', 'comment', 'user_avatar', 'team_logo'
);

-- Tabela principal de anexos
CREATE TABLE public.attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Referências polimórficas (um anexo pode pertencer a diferentes entidades)
    context_type attachment_context NOT NULL,
    context_id UUID NOT NULL, -- ID da entidade (task, project, comment, etc.)
    
    -- Informações do arquivo
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL, -- Caminho no storage (Supabase Storage)
    file_size BIGINT NOT NULL, -- Tamanho em bytes
    mime_type VARCHAR(255) NOT NULL,
    file_type attachment_type NOT NULL,
    
    -- Metadados do arquivo
    file_hash VARCHAR(64), -- SHA-256 hash para detectar duplicatas
    
    -- Informações de imagem (se aplicável)
    image_width INTEGER,
    image_height INTEGER,
    
    -- Informações de vídeo/áudio (se aplicável)
    duration_seconds INTEGER,
    
    -- Configurações e permissões
    is_public BOOLEAN DEFAULT false,
    is_temporary BOOLEAN DEFAULT false, -- Para uploads temporários
    expires_at TIMESTAMP WITH TIME ZONE, -- Para arquivos temporários
    
    -- Descrição e tags
    description TEXT,
    alt_text TEXT, -- Para acessibilidade em imagens
    tags TEXT[] DEFAULT '{}',
    
    -- Metadados customizados
    metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0),
    CONSTRAINT valid_image_dimensions CHECK (
        (image_width IS NULL AND image_height IS NULL) OR
        (image_width > 0 AND image_height > 0)
    ),
    CONSTRAINT valid_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    CONSTRAINT valid_expiration CHECK (
        (is_temporary = false AND expires_at IS NULL) OR
        (is_temporary = true AND expires_at IS NOT NULL)
    )
);

-- Tabela para versões de arquivos (versionamento)
CREATE TABLE public.attachment_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attachment_id UUID REFERENCES public.attachments(id) ON DELETE CASCADE NOT NULL,
    
    version_number INTEGER NOT NULL DEFAULT 1,
    filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64),
    
    -- Changelog
    change_description TEXT,
    
    -- Auditoria
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(attachment_id, version_number)
);

-- Tabela para thumbnails/previews
CREATE TABLE public.attachment_thumbnails (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attachment_id UUID REFERENCES public.attachments(id) ON DELETE CASCADE NOT NULL,
    
    size_name VARCHAR(50) NOT NULL, -- 'small', 'medium', 'large'
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(attachment_id, size_name),
    CONSTRAINT valid_thumbnail_dimensions CHECK (width > 0 AND height > 0)
);

-- Tabela para controle de downloads/visualizações
CREATE TABLE public.attachment_access_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attachment_id UUID REFERENCES public.attachments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'download')),
    ip_address INET,
    user_agent TEXT,
    
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices principais
CREATE INDEX idx_attachments_context ON public.attachments(context_type, context_id);
CREATE INDEX idx_attachments_uploaded_by ON public.attachments(uploaded_by);
CREATE INDEX idx_attachments_file_type ON public.attachments(file_type);
CREATE INDEX idx_attachments_created_at ON public.attachments(created_at);
CREATE INDEX idx_attachments_deleted ON public.attachments(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_temporary ON public.attachments(is_temporary, expires_at) WHERE is_temporary = true;
CREATE INDEX idx_attachments_hash ON public.attachments(file_hash) WHERE file_hash IS NOT NULL;

-- Índices para busca
CREATE INDEX idx_attachments_filename ON public.attachments USING GIN(to_tsvector('portuguese', filename));
CREATE INDEX idx_attachments_tags ON public.attachments USING GIN(tags);

-- Índices para tabelas relacionadas
CREATE INDEX idx_attachment_versions_attachment ON public.attachment_versions(attachment_id);
CREATE INDEX idx_attachment_thumbnails_attachment ON public.attachment_thumbnails(attachment_id);
CREATE INDEX idx_attachment_access_log_attachment ON public.attachment_access_log(attachment_id);
CREATE INDEX idx_attachment_access_log_user ON public.attachment_access_log(user_id);
CREATE INDEX idx_attachment_access_log_accessed_at ON public.attachment_access_log(accessed_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at
CREATE TRIGGER update_attachments_updated_at
    BEFORE UPDATE ON public.attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para determinar tipo de arquivo baseado no MIME type
CREATE OR REPLACE FUNCTION determine_file_type(mime_type_input TEXT)
RETURNS attachment_type AS $$
BEGIN
    CASE 
        WHEN mime_type_input LIKE 'image/%' THEN
            RETURN 'image';
        WHEN mime_type_input LIKE 'video/%' THEN
            RETURN 'video';
        WHEN mime_type_input LIKE 'audio/%' THEN
            RETURN 'audio';
        WHEN mime_type_input IN (
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv'
        ) THEN
            RETURN 'document';
        WHEN mime_type_input IN (
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/gzip',
            'application/x-tar'
        ) THEN
            RETURN 'archive';
        WHEN mime_type_input IN (
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
            'application/json',
            'application/xml',
            'text/xml'
        ) OR mime_type_input LIKE 'text/%' THEN
            RETURN 'code';
        ELSE
            RETURN 'other';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para definir tipo de arquivo automaticamente
CREATE OR REPLACE FUNCTION auto_set_file_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o tipo não foi definido, determinar automaticamente
    IF NEW.file_type IS NULL THEN
        NEW.file_type = determine_file_type(NEW.mime_type);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_set_file_type
    BEFORE INSERT OR UPDATE ON public.attachments
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_file_type();

-- Trigger para criar versão inicial
CREATE OR REPLACE FUNCTION create_initial_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar primeira versão do arquivo
    INSERT INTO public.attachment_versions (
        attachment_id, version_number, filename, file_path, 
        file_size, file_hash, uploaded_by
    ) VALUES (
        NEW.id, 1, NEW.filename, NEW.file_path,
        NEW.file_size, NEW.file_hash, NEW.uploaded_by
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_initial_version
    AFTER INSERT ON public.attachments
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_version();

-- Função para limpeza de arquivos temporários expirados
CREATE OR REPLACE FUNCTION cleanup_expired_attachments()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Marcar como deletados os arquivos temporários expirados
    UPDATE public.attachments
    SET deleted_at = NOW()
    WHERE is_temporary = true
    AND expires_at < NOW()
    AND deleted_at IS NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachment_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachment_thumbnails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachment_access_log ENABLE ROW LEVEL SECURITY;

-- Políticas para attachments
CREATE POLICY "Users can view attachments of accessible content" ON public.attachments
    FOR SELECT
    USING (
        -- Anexos públicos
        is_public = true
        OR
        -- Anexos de tarefas acessíveis
        (context_type = 'task' AND EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = attachments.context_id
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
        ))
        OR
        -- Anexos de projetos acessíveis
        (context_type = 'project' AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = attachments.context_id
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
        ))
        OR
        -- Anexos próprios
        uploaded_by = auth.uid()
    );

CREATE POLICY "Users can upload attachments to accessible content" ON public.attachments
    FOR INSERT
    WITH CHECK (
        -- Verificar se tem acesso ao contexto
        (context_type = 'task' AND EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = attachments.context_id
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
        ))
        OR
        (context_type = 'project' AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = attachments.context_id
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
        ))
        OR
        -- Anexos de avatar/perfil próprio
        (context_type = 'user_avatar' AND context_id::text = auth.uid()::text)
    );

CREATE POLICY "Users can update their own attachments" ON public.attachments
    FOR UPDATE
    USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own attachments or if admin" ON public.attachments
    FOR DELETE
    USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE (context_type = 'task' AND t.id = attachments.context_id)
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

-- Políticas para tabelas relacionadas
CREATE POLICY "Users can view versions of accessible attachments" ON public.attachment_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.attachments a
            WHERE a.id = attachment_versions.attachment_id
            -- A política de attachments já controla o acesso
        )
    );

CREATE POLICY "Users can view thumbnails of accessible attachments" ON public.attachment_thumbnails
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.attachments a
            WHERE a.id = attachment_thumbnails.attachment_id
            -- A política de attachments já controla o acesso
        )
    );

CREATE POLICY "Users can view access logs of their attachments" ON public.attachment_access_log
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.attachments a
            WHERE a.id = attachment_access_log.attachment_id
            AND a.uploaded_by = auth.uid()
        )
    );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter anexos de uma entidade
CREATE OR REPLACE FUNCTION public.get_entity_attachments(
    entity_type attachment_context,
    entity_id UUID
)
RETURNS TABLE (
    id UUID,
    filename VARCHAR,
    original_filename VARCHAR,
    file_size BIGINT,
    mime_type VARCHAR,
    file_type attachment_type,
    is_public BOOLEAN,
    description TEXT,
    uploaded_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    download_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.filename,
        a.original_filename,
        a.file_size,
        a.mime_type,
        a.file_type,
        a.is_public,
        a.description,
        u.full_name as uploaded_by_name,
        a.created_at,
        -- URL será construída no frontend baseada no file_path
        a.file_path as download_url
    FROM public.attachments a
    LEFT JOIN public.users u ON a.uploaded_by = u.id
    WHERE a.context_type = entity_type
    AND a.context_id = entity_id
    AND a.deleted_at IS NULL
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar acesso a anexo
CREATE OR REPLACE FUNCTION public.log_attachment_access(
    attachment_uuid UUID,
    access_type_input VARCHAR(20),
    ip_address_input INET DEFAULT NULL,
    user_agent_input TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.attachment_access_log (
        attachment_id, user_id, access_type, ip_address, user_agent
    ) VALUES (
        attachment_uuid, auth.uid(), access_type_input, 
        ip_address_input, user_agent_input
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de anexos
CREATE OR REPLACE FUNCTION public.get_attachment_stats(
    entity_type attachment_context DEFAULT NULL,
    entity_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_attachments BIGINT,
    total_size_bytes BIGINT,
    attachments_by_type JSONB,
    recent_uploads BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_attachments,
        SUM(file_size) as total_size_bytes,
        jsonb_object_agg(file_type, type_count) as attachments_by_type,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_uploads
    FROM (
        SELECT 
            file_type,
            file_size,
            created_at,
            COUNT(*) OVER (PARTITION BY file_type) as type_count
        FROM public.attachments
        WHERE deleted_at IS NULL
        AND (entity_type IS NULL OR context_type = entity_type)
        AND (entity_id IS NULL OR context_id = entity_id)
    ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE public.attachments IS 'Anexos de arquivos para tarefas, projetos e outras entidades';
COMMENT ON COLUMN public.attachments.id IS 'ID único do anexo';
COMMENT ON COLUMN public.attachments.context_type IS 'Tipo da entidade proprietária (task, project, comment, etc.)';
COMMENT ON COLUMN public.attachments.context_id IS 'ID da entidade proprietária';
COMMENT ON COLUMN public.attachments.filename IS 'Nome do arquivo no storage';
COMMENT ON COLUMN public.attachments.original_filename IS 'Nome original do arquivo enviado';
COMMENT ON COLUMN public.attachments.file_path IS 'Caminho completo no Supabase Storage';
COMMENT ON COLUMN public.attachments.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN public.attachments.mime_type IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN public.attachments.file_type IS 'Categoria do arquivo (image, document, etc.)';
COMMENT ON COLUMN public.attachments.file_hash IS 'Hash SHA-256 para detectar duplicatas';
COMMENT ON COLUMN public.attachments.is_public IS 'Se o arquivo é público (acessível sem autenticação)';
COMMENT ON COLUMN public.attachments.is_temporary IS 'Se é um arquivo temporário com expiração';

COMMENT ON TABLE public.attachment_versions IS 'Versionamento de arquivos anexados';
COMMENT ON TABLE public.attachment_thumbnails IS 'Thumbnails/previews dos anexos';
COMMENT ON TABLE public.attachment_access_log IS 'Log de acessos aos anexos';