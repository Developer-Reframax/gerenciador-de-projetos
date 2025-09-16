-- Função para atualizar estatísticas do projeto
CREATE OR REPLACE FUNCTION update_project_stats(project_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total_count INTEGER;
    completed_count INTEGER;
    progress_percent INTEGER;
BEGIN
    -- Contar total de tarefas do projeto (excluindo deletadas)
    SELECT COUNT(*)
    INTO total_count
    FROM tasks
    WHERE project_id = project_uuid
      AND deleted_at IS NULL;
    
    -- Contar tarefas completadas
    SELECT COUNT(*)
    INTO completed_count
    FROM tasks
    WHERE project_id = project_uuid
      AND status = 'completed'
      AND deleted_at IS NULL;
    
    -- Calcular porcentagem de progresso
    IF total_count > 0 THEN
        progress_percent := ROUND((completed_count::NUMERIC / total_count::NUMERIC) * 100);
    ELSE
        progress_percent := 0;
    END IF;
    
    -- Atualizar a tabela projects
    UPDATE projects
    SET 
        total_tasks = total_count,
        completed_tasks = completed_count,
        progress_percentage = progress_percent,
        updated_at = NOW()
    WHERE id = project_uuid;
END;
$$ LANGUAGE plpgsql;

-- Função trigger para INSERT
CREATE OR REPLACE FUNCTION trigger_update_project_stats_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar estatísticas do projeto
    PERFORM update_project_stats(NEW.project_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função trigger para UPDATE
CREATE OR REPLACE FUNCTION trigger_update_project_stats_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o projeto mudou, atualizar ambos os projetos
    IF OLD.project_id != NEW.project_id THEN
        PERFORM update_project_stats(OLD.project_id);
        PERFORM update_project_stats(NEW.project_id);
    -- Se apenas o status mudou, atualizar o projeto atual
    ELSIF OLD.status != NEW.status OR OLD.deleted_at != NEW.deleted_at OR 
          (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) OR
          (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
        PERFORM update_project_stats(NEW.project_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função trigger para DELETE
CREATE OR REPLACE FUNCTION trigger_update_project_stats_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar estatísticas do projeto
    PERFORM update_project_stats(OLD.project_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers
DROP TRIGGER IF EXISTS tasks_insert_update_project_stats ON tasks;
CREATE TRIGGER tasks_insert_update_project_stats
    AFTER INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_project_stats_insert();

DROP TRIGGER IF EXISTS tasks_update_update_project_stats ON tasks;
CREATE TRIGGER tasks_update_update_project_stats
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_project_stats_update();

DROP TRIGGER IF EXISTS tasks_delete_update_project_stats ON tasks;
CREATE TRIGGER tasks_delete_update_project_stats
    AFTER DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_project_stats_delete();

-- Atualizar estatísticas de todos os projetos existentes
DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN SELECT id FROM projects WHERE deleted_at IS NULL LOOP
        PERFORM update_project_stats(project_record.id);
    END LOOP;
END;
$$;