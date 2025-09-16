-- =====================================================
-- Migration: Create Comments Table
-- Description: Tabela para comentários em tarefas e projetos
-- Author: Sistema de Gerenciamento de Projetos
-- =====================================================

-- Enum para tipos de comentário
CREATE TYPE comment_type AS ENUM (
  'comment',
  'status_change',
  'assignment',
  'mention',
  'system'
);

-- Enum para contexto do comentário
CREATE TYPE comment_context AS ENUM (
  'task',
  'project',
  'team'
);

-- =====================================================
-- TABELA PRINCIPAL: COMMENTS
-- =====================================================
CREATE TABLE comments (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contexto do comentário
  context comment_context NOT NULL,
  context_id UUID NOT NULL, -- ID da tarefa, projeto ou equipe
  
  -- Informações do comentário
  type comment_type NOT NULL DEFAULT 'comment',
  content TEXT NOT NULL,
  content_html TEXT, -- Versão renderizada do markdown
  
  -- Autor e destinatários
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- Para respostas
  
  -- Menções
  mentioned_users UUID[] DEFAULT '{}', -- Array de IDs de usuários mencionados
  
  -- Metadados
  is_edited BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_internal BOOLEAN DEFAULT FALSE, -- Comentário interno da equipe
  
  -- Reações (JSON para flexibilidade)
  reactions JSONB DEFAULT '{}', -- {"👍": ["user_id1", "user_id2"], "❤️": ["user_id3"]}
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT comments_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
  CONSTRAINT comments_valid_context CHECK (
    (context = 'task' AND context_id IS NOT NULL) OR
    (context = 'project' AND context_id IS NOT NULL) OR
    (context = 'team' AND context_id IS NOT NULL)
  )
);

-- =====================================================
-- TABELA: COMMENT_ATTACHMENTS
-- =====================================================
CREATE TABLE comment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para evitar duplicatas
  UNIQUE(comment_id, attachment_id)
);

-- =====================================================
-- TABELA: COMMENT_MENTIONS
-- =====================================================
CREATE TABLE comment_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status da menção
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para evitar duplicatas
  UNIQUE(comment_id, mentioned_user_id)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices para comments
CREATE INDEX idx_comments_context ON comments(context, context_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_mentioned_users ON comments USING GIN(mentioned_users) WHERE mentioned_users != '{}';
CREATE INDEX idx_comments_reactions ON comments USING GIN(reactions) WHERE reactions != '{}';
CREATE INDEX idx_comments_type ON comments(type);
CREATE INDEX idx_comments_pinned ON comments(is_pinned) WHERE is_pinned = TRUE;

-- Índices para comment_attachments
CREATE INDEX idx_comment_attachments_comment ON comment_attachments(comment_id);
CREATE INDEX idx_comment_attachments_attachment ON comment_attachments(attachment_id);

-- Índices para comment_mentions
CREATE INDEX idx_comment_mentions_comment ON comment_mentions(comment_id);
CREATE INDEX idx_comment_mentions_user ON comment_mentions(mentioned_user_id);
CREATE INDEX idx_comment_mentions_unread ON comment_mentions(mentioned_user_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Se o conteúdo foi alterado, marcar como editado
  IF OLD.content != NEW.content THEN
    NEW.is_edited = TRUE;
    NEW.edited_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- Trigger para processar menções
CREATE OR REPLACE FUNCTION process_comment_mentions()
RETURNS TRIGGER AS $$
BEGIN
  -- Limpar menções antigas se for uma atualização
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM comment_mentions WHERE comment_id = NEW.id;
  END IF;
  
  -- Inserir novas menções
  IF NEW.mentioned_users IS NOT NULL AND array_length(NEW.mentioned_users, 1) > 0 THEN
    INSERT INTO comment_mentions (comment_id, mentioned_user_id)
    SELECT NEW.id, unnest(NEW.mentioned_users)
    ON CONFLICT (comment_id, mentioned_user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_comment_mentions
  AFTER INSERT OR UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION process_comment_mentions();

-- Trigger para marcar menção como lida
CREATE OR REPLACE FUNCTION mark_mention_as_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_mention_as_read
  BEFORE UPDATE ON comment_mentions
  FOR EACH ROW
  EXECUTE FUNCTION mark_mention_as_read();

-- =====================================================
-- RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_mentions ENABLE ROW LEVEL SECURITY;

-- Políticas para comments
CREATE POLICY "Users can view comments in their accessible contexts" ON comments
  FOR SELECT USING (
    CASE context
      WHEN 'task' THEN (
        EXISTS (
          SELECT 1 FROM tasks t
          JOIN projects p ON t.project_id = p.id
          WHERE t.id = context_id
          AND (
            p.owner_id = auth.uid() OR
            EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM team_members tm JOIN projects pr ON tm.team_id = pr.team_id WHERE pr.id = p.id AND tm.user_id = auth.uid())
          )
        )
      )
      WHEN 'project' THEN (
        EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id = context_id
          AND (
            p.owner_id = auth.uid() OR
            EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid())
          )
        )
      )
      WHEN 'team' THEN (
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = context_id AND tm.user_id = auth.uid()
        )
      )
      ELSE FALSE
    END
  );

CREATE POLICY "Users can create comments in their accessible contexts" ON comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    CASE context
      WHEN 'task' THEN (
        EXISTS (
          SELECT 1 FROM tasks t
          JOIN projects p ON t.project_id = p.id
          WHERE t.id = context_id
          AND (
            p.owner_id = auth.uid() OR
            EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM team_members tm JOIN projects pr ON tm.team_id = pr.team_id WHERE pr.id = p.id AND tm.user_id = auth.uid())
          )
        )
      )
      WHEN 'project' THEN (
        EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id = context_id
          AND (
            p.owner_id = auth.uid() OR
            EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid())
          )
        )
      )
      WHEN 'team' THEN (
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = context_id AND tm.user_id = auth.uid()
        )
      )
      ELSE FALSE
    END
  );

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (author_id = auth.uid());

-- Políticas para comment_attachments
CREATE POLICY "Users can view comment attachments if they can view the comment" ON comment_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM comments c
      WHERE c.id = comment_id
      -- A política de comments já verifica o acesso
    )
  );

CREATE POLICY "Users can manage attachments of their comments" ON comment_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM comments c
      WHERE c.id = comment_id AND c.author_id = auth.uid()
    )
  );

-- Políticas para comment_mentions
CREATE POLICY "Users can view their own mentions" ON comment_mentions
  FOR SELECT USING (mentioned_user_id = auth.uid());

CREATE POLICY "Users can update their own mentions" ON comment_mentions
  FOR UPDATE USING (mentioned_user_id = auth.uid());

CREATE POLICY "System can create mentions" ON comment_mentions
  FOR INSERT WITH CHECK (TRUE); -- Controlado pelo trigger

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter comentários de um contexto
CREATE OR REPLACE FUNCTION get_comments_by_context(
  p_context comment_context,
  p_context_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  type comment_type,
  content TEXT,
  content_html TEXT,
  author_id UUID,
  author_name TEXT,
  author_avatar_url TEXT,
  parent_id UUID,
  mentioned_users UUID[],
  reactions JSONB,
  is_edited BOOLEAN,
  is_pinned BOOLEAN,
  is_internal BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  attachments_count INTEGER,
  replies_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.type,
    c.content,
    c.content_html,
    c.author_id,
    u.full_name as author_name,
    u.avatar_url as author_avatar_url,
    c.parent_id,
    c.mentioned_users,
    c.reactions,
    c.is_edited,
    c.is_pinned,
    c.is_internal,
    c.created_at,
    c.updated_at,
    c.edited_at,
    COALESCE(att.count, 0)::INTEGER as attachments_count,
    COALESCE(replies.count, 0)::INTEGER as replies_count
  FROM comments c
  JOIN users u ON c.author_id = u.id
  LEFT JOIN (
    SELECT comment_id, COUNT(*) as count
    FROM comment_attachments
    GROUP BY comment_id
  ) att ON c.id = att.comment_id
  LEFT JOIN (
    SELECT parent_id, COUNT(*) as count
    FROM comments
    WHERE parent_id IS NOT NULL
    GROUP BY parent_id
  ) replies ON c.id = replies.parent_id
  WHERE c.context = p_context 
    AND c.context_id = p_context_id
    AND c.parent_id IS NULL -- Apenas comentários principais
  ORDER BY 
    c.is_pinned DESC,
    c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar reação
CREATE OR REPLACE FUNCTION add_comment_reaction(
  p_comment_id UUID,
  p_emoji TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_reactions JSONB;
  user_reactions TEXT[];
BEGIN
  -- Obter reações atuais
  SELECT reactions INTO current_reactions
  FROM comments
  WHERE id = p_comment_id;
  
  -- Inicializar se for NULL
  IF current_reactions IS NULL THEN
    current_reactions := '{}'::JSONB;
  END IF;
  
  -- Obter array de usuários para este emoji
  user_reactions := COALESCE(
    (current_reactions->p_emoji)::TEXT[],
    '{}'
  );
  
  -- Verificar se o usuário já reagiu com este emoji
  IF auth.uid()::TEXT = ANY(user_reactions) THEN
    -- Remover reação
    user_reactions := array_remove(user_reactions, auth.uid()::TEXT);
    
    -- Se não há mais usuários, remover o emoji
    IF array_length(user_reactions, 1) IS NULL THEN
      current_reactions := current_reactions - p_emoji;
    ELSE
      current_reactions := jsonb_set(current_reactions, ARRAY[p_emoji], to_jsonb(user_reactions));
    END IF;
  ELSE
    -- Adicionar reação
    user_reactions := array_append(user_reactions, auth.uid()::TEXT);
    current_reactions := jsonb_set(current_reactions, ARRAY[p_emoji], to_jsonb(user_reactions));
  END IF;
  
  -- Atualizar comentário
  UPDATE comments
  SET reactions = current_reactions
  WHERE id = p_comment_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de comentários
CREATE OR REPLACE FUNCTION get_comment_stats(
  p_context comment_context,
  p_context_id UUID
)
RETURNS TABLE (
  total_comments INTEGER,
  total_replies INTEGER,
  total_mentions INTEGER,
  unread_mentions INTEGER,
  recent_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_comments,
    COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END)::INTEGER as total_replies,
    (
      SELECT COUNT(*)::INTEGER
      FROM comment_mentions cm
      JOIN comments c ON cm.comment_id = c.id
      WHERE c.context = p_context AND c.context_id = p_context_id
    ) as total_mentions,
    (
      SELECT COUNT(*)::INTEGER
      FROM comment_mentions cm
      JOIN comments c ON cm.comment_id = c.id
      WHERE c.context = p_context 
        AND c.context_id = p_context_id
        AND cm.mentioned_user_id = auth.uid()
        AND cm.is_read = FALSE
    ) as unread_mentions,
    MAX(created_at) as recent_activity
  FROM comments
  WHERE context = p_context AND context_id = p_context_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS DA TABELA
-- =====================================================
COMMENT ON TABLE comments IS 'Tabela para armazenar comentários em tarefas, projetos e equipes';
COMMENT ON TABLE comment_attachments IS 'Tabela para relacionar anexos com comentários';
COMMENT ON TABLE comment_mentions IS 'Tabela para rastrear menções em comentários';

COMMENT ON COLUMN comments.context IS 'Contexto do comentário (task, project, team)';
COMMENT ON COLUMN comments.context_id IS 'ID da entidade relacionada ao comentário';
COMMENT ON COLUMN comments.type IS 'Tipo do comentário (comment, status_change, assignment, mention, system)';
COMMENT ON COLUMN comments.content IS 'Conteúdo do comentário em texto/markdown';
COMMENT ON COLUMN comments.content_html IS 'Versão renderizada do conteúdo em HTML';
COMMENT ON COLUMN comments.mentioned_users IS 'Array de IDs de usuários mencionados no comentário';
COMMENT ON COLUMN comments.reactions IS 'Objeto JSON com reações e usuários que reagiram';
COMMENT ON COLUMN comments.is_internal IS 'Indica se é um comentário interno da equipe';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================