-- =====================================================
-- Migration: Create Mention Notification Trigger
-- Description: Trigger para criar notificações quando usuários são mencionados em comentários
-- Author: Sistema de Gerenciamento de Projetos
-- =====================================================

-- =====================================================
-- TRIGGER: Notificação quando usuário é mencionado em comentário
-- =====================================================
CREATE OR REPLACE FUNCTION notify_user_mentioned()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  mentioned_user_id UUID;
  author_name TEXT;
  project_name TEXT;
BEGIN
  -- Verificar se é comentário em projeto e se há usuários mencionados
  IF NEW.context = 'project' AND NEW.mentioned_users IS NOT NULL AND array_length(NEW.mentioned_users, 1) > 0 THEN
    
    -- Buscar informações do projeto
    SELECT p.id, p.name
    INTO project_record
    FROM projects p
    WHERE p.id = NEW.context_id;
    
    -- Buscar nome do autor do comentário
    SELECT full_name INTO author_name FROM users WHERE id = NEW.author_id;
    
    -- Para cada usuário mencionado, criar uma notificação
    FOREACH mentioned_user_id IN ARRAY NEW.mentioned_users
    LOOP
      -- Verificar se o usuário mencionado não é o próprio autor
      IF mentioned_user_id != NEW.author_id THEN
        INSERT INTO notifications (
          user_id,
          type,
          message
        ) VALUES (
          mentioned_user_id,
          'mention',
          COALESCE(author_name, 'Um usuário') || ' mencionou você em um comentário no projeto "' || COALESCE(project_record.name, 'Projeto') || '"'
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
CREATE TRIGGER trigger_notify_user_mentioned
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_mentioned();

-- =====================================================
-- COMENTÁRIOS E OBSERVAÇÕES
-- =====================================================

-- Este trigger:
-- 1. É executado após a inserção de um novo comentário
-- 2. Verifica se o comentário é de contexto 'project'
-- 3. Verifica se há usuários mencionados (mentioned_users não é null e não está vazio)
-- 4. Para cada usuário mencionado:
--    - Verifica se não é o próprio autor (evita auto-notificação)
--    - Cria uma notificação do tipo 'mention'
--    - Inclui o nome do autor e o nome do projeto na mensagem
-- 5. Segue o padrão dos outros triggers existentes no sistema