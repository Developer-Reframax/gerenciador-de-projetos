-- Corrigir função de logs de impedimentos para usar campos corretos da tabela project_logs
CREATE OR REPLACE FUNCTION log_impediment_changes()
RETURNS TRIGGER AS $$
DECLARE
    project_id_value UUID;
    log_data JSONB := '{}'::jsonb;
BEGIN
    -- Obter project_id através do relacionamento com stages
    IF TG_OP = 'DELETE' THEN
        SELECT s.project_id INTO project_id_value
        FROM stages s
        WHERE s.id = OLD.stage_id;
    ELSE
        SELECT s.project_id INTO project_id_value
        FROM stages s
        WHERE s.id = NEW.stage_id;
    END IF;

    -- Processar ações
    IF TG_OP = 'INSERT' THEN
        log_data := jsonb_build_object(
            'impediment_id', NEW.id,
            'stage_id', NEW.stage_id,
            'description', NEW.description,
            'identification_date', NEW.identification_date,
            'responsible_id', NEW.responsible_id,
            'expected_resolution_date', NEW.expected_resolution_date,
            'criticality', NEW.criticality,
            'status', NEW.status
        );
        
        INSERT INTO project_logs (project_id, table_name, record_id, action_type, user_id, new_data, description)
        VALUES (project_id_value, 'impediments', NEW.id, 'INSERT', NEW.responsible_id, log_data, 'Impedimento criado');
        
    ELSIF TG_OP = 'UPDATE' THEN
        
        INSERT INTO project_logs (project_id, table_name, record_id, action_type, user_id, old_data, new_data, description)
        VALUES (project_id_value, 'impediments', NEW.id, 'UPDATE', NEW.responsible_id, 
                jsonb_build_object(
                    'description', OLD.description,
                    'identification_date', OLD.identification_date,
                    'responsible_id', OLD.responsible_id,
                    'expected_resolution_date', OLD.expected_resolution_date,
                    'criticality', OLD.criticality,
                    'status', OLD.status
                ),
                jsonb_build_object(
                    'description', NEW.description,
                    'identification_date', NEW.identification_date,
                    'responsible_id', NEW.responsible_id,
                    'expected_resolution_date', NEW.expected_resolution_date,
                    'criticality', NEW.criticality,
                    'status', NEW.status
                ), 'Impedimento atualizado');
        
    ELSIF TG_OP = 'DELETE' THEN
        log_data := jsonb_build_object(
            'impediment_id', OLD.id,
            'stage_id', OLD.stage_id,
            'description', OLD.description,
            'identification_date', OLD.identification_date,
            'responsible_id', OLD.responsible_id,
            'expected_resolution_date', OLD.expected_resolution_date,
            'criticality', OLD.criticality,
            'status', OLD.status
        );
        
        INSERT INTO project_logs (project_id, table_name, record_id, action_type, user_id, old_data, description)
        VALUES (project_id_value, 'impediments', OLD.id, 'DELETE', OLD.responsible_id, log_data, 'Impedimento excluído');
        
    END IF;

    -- Retornar o registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário para documentação
COMMENT ON FUNCTION log_impediment_changes() IS 'Função corrigida para registrar mudanças na tabela impediments no log do projeto';