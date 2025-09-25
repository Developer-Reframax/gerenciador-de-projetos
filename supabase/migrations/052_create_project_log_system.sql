-- Migração para implementar sistema de logs para a tabela projects
-- Data: 2025-01-25
-- Descrição: Cria função e triggers para registrar mudanças na tabela projects

-- Função para registrar mudanças na tabela projects
CREATE OR REPLACE FUNCTION log_project_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
    log_description text;
BEGIN
    -- Obter o ID do usuário atual
    current_user_id := auth.uid();
    
    -- Se não houver usuário autenticado, usar o owner_id do projeto
    IF current_user_id IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            current_user_id := OLD.owner_id;
        ELSE
            current_user_id := NEW.owner_id;
        END IF;
    END IF;
    
    -- Definir descrição baseada na operação
    IF TG_OP = 'INSERT' THEN
        log_description := 'Projeto criado: ' || NEW.name;
    ELSIF TG_OP = 'UPDATE' THEN
        log_description := 'Projeto atualizado: ' || NEW.name;
        
        -- Adicionar detalhes específicos das mudanças
        IF OLD.status != NEW.status THEN
            log_description := log_description || ' (Status alterado de ' || OLD.status || ' para ' || NEW.status || ')';
        END IF;
        
        IF OLD.priority != NEW.priority THEN
            log_description := log_description || ' (Prioridade alterada de ' || OLD.priority || ' para ' || NEW.priority || ')';
        END IF;
        
        IF OLD.progress_percentage != NEW.progress_percentage THEN
            log_description := log_description || ' (Progresso alterado de ' || OLD.progress_percentage || '% para ' || NEW.progress_percentage || '%)';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        log_description := 'Projeto excluído: ' || OLD.name;
    END IF;
    
    -- Inserir log na tabela project_logs
    IF TG_OP = 'DELETE' THEN
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
            OLD.id,
            'projects',
            OLD.id,
            TG_OP,
            current_user_id,
            jsonb_build_object(
                'id', OLD.id,
                'name', OLD.name,
                'description', OLD.description,
                'status', OLD.status,
                'priority', OLD.priority,
                'owner_id', OLD.owner_id,
                'team_id', OLD.team_id,
                'start_date', OLD.start_date,
                'due_date', OLD.due_date,
                'budget', OLD.budget,
                'progress_percentage', OLD.progress_percentage,
                'visibility', OLD.visibility,
                'is_active', OLD.is_active,
                'archived', OLD.archived,
                'requester_id', OLD.requester_id,
                'strategic_objective_id', OLD.strategic_objective_id,
                'strategic_pillar_id', OLD.strategic_pillar_id,
                'request_date', OLD.request_date,
                'committee_approval_date', OLD.committee_approval_date,
                'real_start_date', OLD.real_start_date,
                'real_end_date', OLD.real_end_date,
                'lessons_learned', OLD.lessons_learned,
                'created_at', OLD.created_at,
                'updated_at', OLD.updated_at,
                'completed_at', OLD.completed_at
            ),
            NULL,
            log_description
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
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
            NEW.id,
            'projects',
            NEW.id,
            TG_OP,
            current_user_id,
            jsonb_build_object(
                'id', OLD.id,
                'name', OLD.name,
                'description', OLD.description,
                'status', OLD.status,
                'priority', OLD.priority,
                'owner_id', OLD.owner_id,
                'team_id', OLD.team_id,
                'start_date', OLD.start_date,
                'due_date', OLD.due_date,
                'budget', OLD.budget,
                'progress_percentage', OLD.progress_percentage,
                'visibility', OLD.visibility,
                'is_active', OLD.is_active,
                'archived', OLD.archived,
                'requester_id', OLD.requester_id,
                'strategic_objective_id', OLD.strategic_objective_id,
                'strategic_pillar_id', OLD.strategic_pillar_id,
                'request_date', OLD.request_date,
                'committee_approval_date', OLD.committee_approval_date,
                'real_start_date', OLD.real_start_date,
                'real_end_date', OLD.real_end_date,
                'lessons_learned', OLD.lessons_learned,
                'created_at', OLD.created_at,
                'updated_at', OLD.updated_at,
                'completed_at', OLD.completed_at
            ),
            jsonb_build_object(
                'id', NEW.id,
                'name', NEW.name,
                'description', NEW.description,
                'status', NEW.status,
                'priority', NEW.priority,
                'owner_id', NEW.owner_id,
                'team_id', NEW.team_id,
                'start_date', NEW.start_date,
                'due_date', NEW.due_date,
                'budget', NEW.budget,
                'progress_percentage', NEW.progress_percentage,
                'visibility', NEW.visibility,
                'is_active', NEW.is_active,
                'archived', NEW.archived,
                'requester_id', NEW.requester_id,
                'strategic_objective_id', NEW.strategic_objective_id,
                'strategic_pillar_id', NEW.strategic_pillar_id,
                'request_date', NEW.request_date,
                'committee_approval_date', NEW.committee_approval_date,
                'real_start_date', NEW.real_start_date,
                'real_end_date', NEW.real_end_date,
                'lessons_learned', NEW.lessons_learned,
                'created_at', NEW.created_at,
                'updated_at', NEW.updated_at,
                'completed_at', NEW.completed_at
            ),
            log_description
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
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
            NEW.id,
            'projects',
            NEW.id,
            TG_OP,
            current_user_id,
            NULL,
            jsonb_build_object(
                'id', NEW.id,
                'name', NEW.name,
                'description', NEW.description,
                'status', NEW.status,
                'priority', NEW.priority,
                'owner_id', NEW.owner_id,
                'team_id', NEW.team_id,
                'start_date', NEW.start_date,
                'due_date', NEW.due_date,
                'budget', NEW.budget,
                'progress_percentage', NEW.progress_percentage,
                'visibility', NEW.visibility,
                'is_active', NEW.is_active,
                'archived', NEW.archived,
                'requester_id', NEW.requester_id,
                'strategic_objective_id', NEW.strategic_objective_id,
                'strategic_pillar_id', NEW.strategic_pillar_id,
                'request_date', NEW.request_date,
                'committee_approval_date', NEW.committee_approval_date,
                'real_start_date', NEW.real_start_date,
                'real_end_date', NEW.real_end_date,
                'lessons_learned', NEW.lessons_learned,
                'created_at', NEW.created_at,
                'updated_at', NEW.updated_at,
                'completed_at', NEW.completed_at
            ),
            log_description
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS trigger_log_project_insert ON projects;
DROP TRIGGER IF EXISTS trigger_log_project_update ON projects;
DROP TRIGGER IF EXISTS trigger_log_project_delete ON projects;

-- Criar triggers para INSERT, UPDATE e DELETE
CREATE TRIGGER trigger_log_project_insert
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION log_project_changes();

CREATE TRIGGER trigger_log_project_update
    AFTER UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION log_project_changes();

CREATE TRIGGER trigger_log_project_delete
    BEFORE DELETE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION log_project_changes();

-- Comentários para documentação
COMMENT ON FUNCTION log_project_changes() IS 'Função para registrar mudanças na tabela projects no sistema de logs';
COMMENT ON TRIGGER trigger_log_project_insert ON projects IS 'Trigger para registrar inserções na tabela projects';
COMMENT ON TRIGGER trigger_log_project_update ON projects IS 'Trigger para registrar atualizações na tabela projects';
COMMENT ON TRIGGER trigger_log_project_delete ON projects IS 'Trigger para registrar exclusões na tabela projects';