-- Fix project logs triggers for attachments and comments tables
-- This migration corrects the create_project_log() function to handle proper field mapping

-- Drop and recreate the create_project_log function with fixes
DROP FUNCTION IF EXISTS create_project_log() CASCADE;

CREATE OR REPLACE FUNCTION create_project_log()
RETURNS TRIGGER AS $$
DECLARE
    project_uuid UUID;
    user_uuid UUID;
    log_description TEXT;
BEGIN
    -- Determinar o project_id baseado na tabela
    CASE TG_TABLE_NAME
        WHEN 'projects' THEN
            project_uuid := COALESCE(NEW.id, OLD.id);
        WHEN 'tasks' THEN
            -- Tasks estão ligados a stages, que estão ligados a projetos
            SELECT s.project_id INTO project_uuid 
            FROM stages s
            WHERE s.id = COALESCE(NEW.stage_id, OLD.stage_id);
        WHEN 'comments' THEN
            -- Comments usam context e context_id para determinar o projeto
            CASE COALESCE(NEW.context, OLD.context)
                WHEN 'project' THEN
                    project_uuid := COALESCE(NEW.context_id, OLD.context_id);
                WHEN 'task' THEN
                    SELECT p.id INTO project_uuid 
                    FROM tasks t
                    JOIN projects p ON t.project_id = p.id
                    WHERE t.id = COALESCE(NEW.context_id, OLD.context_id);
                WHEN 'team' THEN
                    -- Para comentários de equipe, buscar projeto através da equipe
                    SELECT p.id INTO project_uuid 
                    FROM projects p
                    WHERE p.team_id = COALESCE(NEW.context_id, OLD.context_id)
                    LIMIT 1;
                ELSE
                    project_uuid := NULL;
            END CASE;
        WHEN 'attachments' THEN
            -- Attachments estão diretamente ligados ao projeto
            project_uuid := COALESCE(NEW.project_id, OLD.project_id);
        ELSE
            -- Para outras tabelas, tentar usar project_id diretamente
            project_uuid := COALESCE(NEW.project_id, OLD.project_id);
    END CASE;

    -- Se não conseguiu determinar o projeto, sair
    IF project_uuid IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Determinar o usuário
    user_uuid := COALESCE(NEW.user_id, NEW.author_id, NEW.uploaded_by, OLD.user_id, OLD.author_id, OLD.uploaded_by, auth.uid());

    -- Gerar descrição baseada na operação
    CASE TG_OP
        WHEN 'INSERT' THEN
            CASE TG_TABLE_NAME
                WHEN 'attachments' THEN
                    log_description := 'Criou ' || get_entity_name(TG_TABLE_NAME) || ': ' || COALESCE(NEW.name, 'Novo arquivo');
                WHEN 'comments' THEN
                    log_description := 'Criou ' || get_entity_name(TG_TABLE_NAME) || ': ' || COALESCE(LEFT(NEW.content, 50), 'Novo comentário');
                ELSE
                    log_description := 'Criou ' || get_entity_name(TG_TABLE_NAME) || ': ' || COALESCE(NEW.name, NEW.title, NEW.description, 'Novo registro');
            END CASE;
        WHEN 'UPDATE' THEN
            CASE TG_TABLE_NAME
                WHEN 'attachments' THEN
                    log_description := 'Atualizou ' || get_entity_name(TG_TABLE_NAME) || ': ' || COALESCE(NEW.name, 'Arquivo');
                WHEN 'comments' THEN
                    log_description := 'Atualizou ' || get_entity_name(TG_TABLE_NAME) || ': ' || COALESCE(LEFT(NEW.content, 50), 'Comentário');
                ELSE
                    log_description := 'Atualizou ' || get_entity_name(TG_TABLE_NAME) || ': ' || COALESCE(NEW.name, NEW.title, NEW.description, 'Registro');
            END CASE;
        WHEN 'DELETE' THEN
            CASE TG_TABLE_NAME
                WHEN 'attachments' THEN
                    log_description := 'Excluiu ' || get_entity_name(TG_TABLE_NAME) || ': ' || COALESCE(OLD.name, 'Arquivo');
                WHEN 'comments' THEN
                    log_description := 'Excluiu ' || get_entity_name(TG_TABLE_NAME) || ': ' || COALESCE(LEFT(OLD.content, 50), 'Comentário');
                ELSE
                    log_description := 'Excluiu ' || get_entity_name(TG_TABLE_NAME) || ': ' || COALESCE(OLD.name, OLD.title, OLD.description, 'Registro');
            END CASE;
    END CASE;

    -- Inserir o log
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
        project_uuid,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        user_uuid,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        log_description
    );

    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, não falhar a operação principal
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate all triggers that were dropped by CASCADE
CREATE TRIGGER trigger_projects_log
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION create_project_log();

CREATE TRIGGER trigger_stages_log
    AFTER INSERT OR UPDATE OR DELETE ON stages
    FOR EACH ROW EXECUTE FUNCTION create_project_log();

CREATE TRIGGER trigger_tasks_log
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION create_project_log();

CREATE TRIGGER trigger_risks_log
    AFTER INSERT OR UPDATE OR DELETE ON risks
    FOR EACH ROW EXECUTE FUNCTION create_project_log();

CREATE TRIGGER trigger_impediments_log
    AFTER INSERT OR UPDATE OR DELETE ON impediments
    FOR EACH ROW EXECUTE FUNCTION create_project_log();

CREATE TRIGGER trigger_project_deviations_log
    AFTER INSERT OR UPDATE OR DELETE ON project_deviations
    FOR EACH ROW EXECUTE FUNCTION create_project_log();

CREATE TRIGGER trigger_comments_log
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION create_project_log();

CREATE TRIGGER trigger_attachments_log
    AFTER INSERT OR UPDATE OR DELETE ON attachments
    FOR EACH ROW EXECUTE FUNCTION create_project_log();