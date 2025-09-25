-- Migração para Sistema de Logs de Projeto
-- Cria tabela project_logs, funções e triggers para auditoria automática

-- Criar tabela de logs
CREATE TABLE project_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    old_data JSONB,
    new_data JSONB,
    description TEXT,
    CONSTRAINT fk_project_logs_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_logs_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Criar índices para performance
CREATE INDEX idx_project_logs_project_id ON project_logs(project_id);
CREATE INDEX idx_project_logs_created_at ON project_logs(created_at DESC);
CREATE INDEX idx_project_logs_table_name ON project_logs(table_name);
CREATE INDEX idx_project_logs_action_type ON project_logs(action_type);
CREATE INDEX idx_project_logs_user_id ON project_logs(user_id);

-- Política RLS para project_logs
ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver logs apenas de projetos onde são colaboradores
CREATE POLICY "Users can view logs of their projects" ON project_logs
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN project_collaborators pc ON p.id = pc.project_id
            WHERE pc.user_id = auth.uid()
        )
    );

-- Apenas o sistema pode inserir logs (via triggers)
CREATE POLICY "System can insert logs" ON project_logs
    FOR INSERT WITH CHECK (true);

-- Função auxiliar para nomes de entidades
CREATE OR REPLACE FUNCTION get_entity_name(table_name TEXT)
RETURNS TEXT AS $$
BEGIN
    CASE table_name
        WHEN 'projects' THEN RETURN 'projeto';
        WHEN 'stages' THEN RETURN 'etapa';
        WHEN 'tasks' THEN RETURN 'tarefa';
        WHEN 'risks' THEN RETURN 'risco';
        WHEN 'impediments' THEN RETURN 'impedimento';
        WHEN 'project_deviations' THEN RETURN 'desvio';
        WHEN 'comments' THEN RETURN 'comentário';
        WHEN 'attachments' THEN RETURN 'anexo';
        ELSE RETURN 'registro';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Função para criar logs automaticamente
CREATE OR REPLACE FUNCTION create_project_log()
RETURNS TRIGGER AS $$
DECLARE
    project_uuid UUID;
    current_user_id UUID;
    log_description TEXT;
BEGIN
    -- Obter user_id atual
    current_user_id := auth.uid();
    
    -- Se não há usuário autenticado, pular log
    IF current_user_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Determinar project_id baseado na tabela
    CASE TG_TABLE_NAME
        WHEN 'projects' THEN
            project_uuid := COALESCE(NEW.id, OLD.id);
        WHEN 'stages' THEN
            project_uuid := COALESCE(NEW.project_id, OLD.project_id);
        WHEN 'tasks' THEN
            SELECT s.project_id INTO project_uuid 
            FROM stages s 
            WHERE s.id = COALESCE(NEW.stage_id, OLD.stage_id);
        WHEN 'risks', 'impediments', 'project_deviations' THEN
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
            -- Se não conseguir determinar o projeto, pular
            RETURN COALESCE(NEW, OLD);
    END CASE;
    
    -- Se não conseguiu determinar o projeto, pular
    IF project_uuid IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
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
    
    -- Inserir log
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
        current_user_id,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        log_description
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para cada tabela
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

-- Garantir que a tabela tenha as permissões corretas
GRANT SELECT ON project_logs TO authenticated;
GRANT INSERT ON project_logs TO service_role;

-- Comentário final
COMMENT ON TABLE project_logs IS 'Tabela de auditoria para registrar todas as operações realizadas em projetos e suas entidades relacionadas';