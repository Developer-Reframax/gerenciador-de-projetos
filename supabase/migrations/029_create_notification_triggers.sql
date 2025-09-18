-- =====================================================
-- Migration: Create Notification Triggers
-- Description: Triggers para inserir notificações automáticas
-- Author: Sistema de Gerenciamento de Projetos
-- =====================================================

-- =====================================================
-- 1. TRIGGER: Notificação de boas-vindas para novo usuário
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    message
  ) VALUES (
    NEW.id,
    'system',
    'Bem-vindo ao HubMax! Estamos felizes em tê-lo conosco. Explore todas as funcionalidades e comece a gerenciar seus projetos de forma eficiente.'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_user();

-- =====================================================
-- 2. TRIGGER: Notificação quando usuário é inserido em equipe
-- =====================================================
CREATE OR REPLACE FUNCTION notify_user_added_to_team()
RETURNS TRIGGER AS $$
DECLARE
  team_name TEXT;
BEGIN
  -- Buscar nome da equipe
  SELECT name INTO team_name FROM teams WHERE id = NEW.team_id;
  
  INSERT INTO notifications (
    user_id,
    type,
    message
  ) VALUES (
    NEW.user_id,
    'team',
    'Você foi adicionado à equipe "' || COALESCE(team_name, 'Equipe') || '". Agora você pode colaborar nos projetos desta equipe.'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_user_added_to_team
  AFTER INSERT OR UPDATE ON team_members
  FOR EACH ROW
  WHEN (
    (TG_OP = 'INSERT' AND NEW.status = 'active') OR
    (TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active')
  )
  EXECUTE FUNCTION notify_user_added_to_team();

-- =====================================================
-- 3. TRIGGER: Notificação quando tarefa é concluída
-- =====================================================
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  team_member RECORD;
  task_title TEXT;
  task_project_id UUID;
  project_name TEXT;
  task_team_id UUID;
  completion_percentage NUMERIC;
BEGIN
  -- Verificar se a tarefa foi marcada como concluída
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    
    -- Buscar informações da tarefa e projeto
    SELECT t.title, p.id, p.name, p.team_id
    INTO task_title, task_project_id, project_name, task_team_id
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = NEW.id;
    
    -- Calcular percentual de conclusão do projeto
    SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed') * 100.0) / COUNT(*), 1)
      END
    INTO completion_percentage
    FROM tasks
    WHERE project_id = task_project_id;
    
    -- Notificar todos os membros da equipe
    FOR team_member IN 
      SELECT user_id FROM team_members WHERE team_id = task_team_id
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        message
      ) VALUES (
        team_member.user_id,
        'task',
        'A tarefa "' || COALESCE(task_title, 'Tarefa') || '" do projeto "' || COALESCE(project_name, 'Projeto') || '" foi concluída. Progresso do projeto: ' || completion_percentage || '%'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_task_completed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();

-- =====================================================
-- 4. TRIGGER: Notificação quando comentário é adicionado
-- =====================================================
CREATE OR REPLACE FUNCTION notify_comment_added()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  team_member RECORD;
  author_name TEXT;
BEGIN
  -- Verificar se é comentário em projeto
  IF NEW.context = 'project' THEN
    
    -- Buscar informações do projeto
    SELECT p.id, p.name, p.team_id
    INTO project_record
    FROM projects p
    WHERE p.id = NEW.context_id;
    
    -- Buscar nome do autor
    SELECT full_name INTO author_name FROM users WHERE id = NEW.author_id;
    
    -- Notificar todos os membros da equipe (exceto o autor)
    FOR team_member IN 
      SELECT user_id FROM team_members 
      WHERE team_id = project_record.team_id AND user_id != NEW.author_id
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        message
      ) VALUES (
        team_member.user_id,
        'comment',
        COALESCE(author_name, 'Um usuário') || ' adicionou um comentário no projeto "' || COALESCE(project_record.name, 'Projeto') || '"'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_comment_added
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_added();

-- =====================================================
-- 5. TRIGGER: Notificação quando anexo é adicionado
-- =====================================================
CREATE OR REPLACE FUNCTION notify_attachment_added()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  team_member RECORD;
  uploader_name TEXT;
BEGIN
  -- Buscar informações do projeto usando project_id diretamente
  SELECT p.id, p.name, p.team_id
  INTO project_record
  FROM projects p
  WHERE p.id = NEW.project_id;
  
  -- Buscar nome do usuário que fez upload
  SELECT full_name INTO uploader_name FROM users WHERE id = NEW.user_id;
  
  -- Notificar todos os membros da equipe (exceto quem fez upload)
  FOR team_member IN 
    SELECT user_id FROM team_members 
    WHERE team_id = project_record.team_id AND user_id != NEW.user_id
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      message
    ) VALUES (
      team_member.user_id,
      'attachment',
      COALESCE(uploader_name, 'Um usuário') || ' adicionou o anexo "' || COALESCE(NEW.name, 'arquivo') || '" no projeto "' || COALESCE(project_record.name, 'Projeto') || '"'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_attachment_added
  AFTER INSERT ON attachments
  FOR EACH ROW
  EXECUTE FUNCTION notify_attachment_added();

-- =====================================================
-- 6. TRIGGER: Notificação quando desvio é cadastrado
-- =====================================================
CREATE OR REPLACE FUNCTION notify_deviation_created()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  team_member RECORD;
  creator_name TEXT;
BEGIN
  -- Buscar informações do projeto
  SELECT p.id, p.name, p.team_id
  INTO project_record
  FROM projects p
  WHERE p.id = NEW.project_id;
  
  -- Buscar nome do criador do desvio
  SELECT full_name INTO creator_name FROM users WHERE id = NEW.requested_by;
  
  -- Notificar todos os membros da equipe
  FOR team_member IN 
    SELECT user_id FROM team_members WHERE team_id = project_record.team_id
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      message
    ) VALUES (
      team_member.user_id,
      'deviation',
      'Um desvio foi cadastrado no projeto "' || COALESCE(project_record.name, 'Projeto') || '". Critério: ' || NEW.evaluation_criteria || '. Impacto: ' || NEW.impact_type || '. ' || 
      CASE WHEN NEW.generates_impediment THEN 'ATENÇÃO: Este desvio gera impedimento!' ELSE '' END
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_deviation_created
  AFTER INSERT ON project_deviations
  FOR EACH ROW
  EXECUTE FUNCTION notify_deviation_created();

-- =====================================================
-- 7. TRIGGER: Notificação quando nova tarefa é adicionada
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  assignee_name TEXT;
BEGIN
  -- Verificar se a tarefa tem responsável
  IF NEW.assigned_to IS NOT NULL THEN
    
    -- Buscar informações do projeto
    SELECT p.id, p.name
    INTO project_record
    FROM projects p
    WHERE p.id = NEW.project_id;
    
    -- Buscar nome do responsável
    SELECT full_name INTO assignee_name FROM users WHERE id = NEW.assigned_to;
    
    -- Notificar o responsável pela tarefa
    INSERT INTO notifications (
      user_id,
      type,
      message
    ) VALUES (
      NEW.assigned_to,
      'task',
      'Você foi designado como responsável pela tarefa "' || COALESCE(NEW.title, 'Nova tarefa') || '" no projeto "' || COALESCE(project_record.name, 'Projeto') || '". Prioridade: ' || COALESCE(NEW.priority, 'Não definida') || '. Prazo: ' || 
      CASE WHEN NEW.due_date IS NOT NULL THEN TO_CHAR(NEW.due_date, 'DD/MM/YYYY') ELSE 'Não definido' END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_task_assigned
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_task_assigned();

-- =====================================================
-- COMENTÁRIOS E OBSERVAÇÕES
-- =====================================================

-- Os triggers foram criados para as seguintes situações:
-- 1. Novo usuário criado -> Notificação de boas-vindas
-- 2. Usuário inserido em equipe -> Notificação de inserção na equipe
-- 3. Tarefa concluída -> Notificação para todos os membros da equipe com percentual
-- 4. Comentário adicionado -> Notificação para todos os membros da equipe
-- 5. Anexo adicionado -> Notificação para todos os membros da equipe
-- 6. Desvio cadastrado -> Notificação para todos os membros da equipe com detalhes
-- 7. Nova tarefa -> Notificação para o responsável com detalhes

-- Todos os triggers seguem a estrutura existente do projeto e mantêm
-- a simplicidade solicitada, garantindo funcionalidade básica e eficiente.