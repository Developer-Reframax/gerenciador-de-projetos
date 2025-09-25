-- Criar sistema de logs para a tabela tasks
-- Seguindo a mesma metodologia dos comments e attachments

-- Função para registrar mudanças nas tasks
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Para INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_logs (
      project_id,
      table_name,
      record_id,
      action_type,
      user_id,
      new_data,
      description
    ) VALUES (
      NEW.project_id,
      'tasks',
      NEW.id,
      'INSERT',
      NEW.reporter_id, -- Usuário que criou a task
      jsonb_build_object(
        'title', NEW.title,
        'description', NEW.description,
        'priority', NEW.priority,
        'status', NEW.status,
        'assignee_id', NEW.assignee_id,
        'stage_id', NEW.stage_id,
        'parent_task_id', NEW.parent_task_id,
        'start_date', NEW.start_date,
        'due_date', NEW.due_date,
        'estimated_hours', NEW.estimated_hours,
        'story_points', NEW.story_points,
        'is_milestone', NEW.is_milestone,
        'position', NEW.position
      ),
      'Task criada: ' || NEW.title
    );
    RETURN NEW;
  END IF;

  -- Para UPDATE
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO project_logs (
      project_id,
      table_name,
      record_id,
      action_type,
      user_id,
      old_data,
      new_data,
      description
    ) VALUES (
      NEW.project_id,
      'tasks',
      NEW.id,
      'UPDATE',
      NEW.reporter_id, -- Mantém o reporter como responsável pelo log
      jsonb_build_object(
        'title', OLD.title,
        'description', OLD.description,
        'priority', OLD.priority,
        'status', OLD.status,
        'assignee_id', OLD.assignee_id,
        'stage_id', OLD.stage_id,
        'parent_task_id', OLD.parent_task_id,
        'start_date', OLD.start_date,
        'due_date', OLD.due_date,
        'estimated_hours', OLD.estimated_hours,
        'actual_hours', OLD.actual_hours,
        'story_points', OLD.story_points,
        'is_milestone', OLD.is_milestone,
        'position', OLD.position,
        'completed_at', OLD.completed_at
      ),
      jsonb_build_object(
        'title', NEW.title,
        'description', NEW.description,
        'priority', NEW.priority,
        'status', NEW.status,
        'assignee_id', NEW.assignee_id,
        'stage_id', NEW.stage_id,
        'parent_task_id', NEW.parent_task_id,
        'start_date', NEW.start_date,
        'due_date', NEW.due_date,
        'estimated_hours', NEW.estimated_hours,
        'actual_hours', NEW.actual_hours,
        'story_points', NEW.story_points,
        'is_milestone', NEW.is_milestone,
        'position', NEW.position,
        'completed_at', NEW.completed_at
      ),
      'Task atualizada: ' || NEW.title
    );
    RETURN NEW;
  END IF;

  -- Para DELETE
  IF TG_OP = 'DELETE' THEN
    INSERT INTO project_logs (
      project_id,
      table_name,
      record_id,
      action_type,
      user_id,
      old_data,
      description
    ) VALUES (
      OLD.project_id,
      'tasks',
      OLD.id,
      'DELETE',
      OLD.reporter_id, -- Usuário que criou a task
      jsonb_build_object(
        'title', OLD.title,
        'description', OLD.description,
        'priority', OLD.priority,
        'status', OLD.status,
        'assignee_id', OLD.assignee_id,
        'stage_id', OLD.stage_id,
        'parent_task_id', OLD.parent_task_id,
        'start_date', OLD.start_date,
        'due_date', OLD.due_date,
        'estimated_hours', OLD.estimated_hours,
        'actual_hours', OLD.actual_hours,
        'story_points', OLD.story_points,
        'is_milestone', OLD.is_milestone,
        'position', OLD.position,
        'completed_at', OLD.completed_at
      ),
      'Task excluída: ' || OLD.title
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers para INSERT, UPDATE e DELETE
CREATE TRIGGER task_insert_log_trigger
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_changes();

CREATE TRIGGER task_update_log_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_changes();

CREATE TRIGGER task_delete_log_trigger
  AFTER DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_changes();

-- Comentário explicativo
COMMENT ON FUNCTION log_task_changes() IS 'Função para registrar mudanças nas tasks (INSERT, UPDATE, DELETE) na tabela project_logs';
COMMENT ON TRIGGER task_insert_log_trigger ON tasks IS 'Trigger para registrar criação de tasks';
COMMENT ON TRIGGER task_update_log_trigger ON tasks IS 'Trigger para registrar atualizações de tasks';
COMMENT ON TRIGGER task_delete_log_trigger ON tasks IS 'Trigger para registrar exclusão de tasks';