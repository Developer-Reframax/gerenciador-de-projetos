-- Migração para expandir tabelas workflow_comments e workflow_attachments
-- Seguindo o padrão estabelecido para comentários e anexos de projetos

-- Expandir tabela workflow_comments
ALTER TABLE workflow_comments 
ADD COLUMN type VARCHAR(20) DEFAULT 'comment' CHECK (type IN ('comment', 'status_change', 'assignment', 'mention', 'system')),
ADD COLUMN mentioned_users UUID[] DEFAULT '{}',
ADD COLUMN reactions JSONB DEFAULT '{}',
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_internal BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;

-- Renomear user_id para author_id para consistência
ALTER TABLE workflow_comments RENAME COLUMN user_id TO author_id;

-- Expandir tabela workflow_attachments
ALTER TABLE workflow_attachments 
ADD COLUMN original_filename VARCHAR(255),
ADD COLUMN mime_type VARCHAR(255),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Renomear file_name para filename para consistência
ALTER TABLE workflow_attachments RENAME COLUMN file_name TO filename;

-- Atualizar trigger para updated_at na tabela workflow_attachments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflow_attachments_updated_at
    BEFORE UPDATE ON workflow_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_workflow_comments_type ON workflow_comments(type);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_author_id ON workflow_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_parent_id ON workflow_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_is_pinned ON workflow_comments(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_workflow_attachments_uploaded_by ON workflow_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_workflow_attachments_mime_type ON workflow_attachments(mime_type);

-- Comentários nas tabelas
COMMENT ON COLUMN workflow_comments.type IS 'Tipo do comentário: comment, status_change, assignment, mention, system';
COMMENT ON COLUMN workflow_comments.mentioned_users IS 'Array de IDs de usuários mencionados no comentário';
COMMENT ON COLUMN workflow_comments.reactions IS 'Reações ao comentário em formato JSON';
COMMENT ON COLUMN workflow_comments.is_edited IS 'Indica se o comentário foi editado';
COMMENT ON COLUMN workflow_comments.is_pinned IS 'Indica se o comentário está fixado';
COMMENT ON COLUMN workflow_comments.is_internal IS 'Indica se o comentário é interno (não visível para todos)';
COMMENT ON COLUMN workflow_comments.edited_at IS 'Data da última edição do comentário';

COMMENT ON COLUMN workflow_attachments.original_filename IS 'Nome original do arquivo antes do upload';
COMMENT ON COLUMN workflow_attachments.mime_type IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN workflow_attachments.updated_at IS 'Data da última atualização do anexo';