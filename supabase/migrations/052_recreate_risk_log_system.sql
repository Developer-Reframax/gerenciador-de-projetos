-- Recreate risk log system with correct structure
-- This migration drops existing triggers and function, then recreates them with the correct project_logs structure

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_log_risk_insert ON risks;
DROP TRIGGER IF EXISTS trigger_log_risk_update ON risks;
DROP TRIGGER IF EXISTS trigger_log_risk_delete ON risks;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS log_risk_changes();

-- Function to log risk changes
CREATE OR REPLACE FUNCTION log_risk_changes()
RETURNS TRIGGER AS $$
DECLARE
    project_id_value UUID;
    old_data_json JSONB;
    new_data_json JSONB;
    description_text TEXT;
BEGIN
    -- Get project_id from stage
    SELECT p.id INTO project_id_value
    FROM stages s
    JOIN projects p ON s.project_id = p.id
    WHERE s.id = COALESCE(NEW.stage_id, OLD.stage_id);
    
    -- Prepare log data based on operation
    IF TG_OP = 'INSERT' THEN
        new_data_json := jsonb_build_object(
            'name', NEW.name,
            'description', NEW.description,
            'status', NEW.status,
            'impact', NEW.impact,
            'probability', NEW.probability,
            'identification_date', NEW.identification_date,
            'expected_resolution_date', NEW.expected_resolution_date
        );
        
        description_text := 'Risco criado: ' || NEW.name;
        
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
            project_id_value,
            'risks',
            NEW.id,
            'INSERT',
            NEW.responsible_id,
            NULL,
            new_data_json,
            description_text
        );
        
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        old_data_json := jsonb_build_object(
            'name', OLD.name,
            'description', OLD.description,
            'status', OLD.status,
            'impact', OLD.impact,
            'probability', OLD.probability,
            'identification_date', OLD.identification_date,
            'expected_resolution_date', OLD.expected_resolution_date
        );
        
        new_data_json := jsonb_build_object(
            'name', NEW.name,
            'description', NEW.description,
            'status', NEW.status,
            'impact', NEW.impact,
            'probability', NEW.probability,
            'identification_date', NEW.identification_date,
            'expected_resolution_date', NEW.expected_resolution_date
        );
        
        description_text := 'Risco atualizado: ' || NEW.name;
        
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
            project_id_value,
            'risks',
            NEW.id,
            'UPDATE',
            NEW.responsible_id,
            old_data_json,
            new_data_json,
            description_text
        );
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        old_data_json := jsonb_build_object(
            'name', OLD.name,
            'description', OLD.description,
            'status', OLD.status,
            'impact', OLD.impact,
            'probability', OLD.probability,
            'identification_date', OLD.identification_date,
            'expected_resolution_date', OLD.expected_resolution_date
        );
        
        description_text := 'Risco excluído: ' || OLD.name;
        
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
            project_id_value,
            'risks',
            OLD.id,
            'DELETE',
            OLD.responsible_id,
            old_data_json,
            NULL,
            description_text
        );
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for risks table
CREATE TRIGGER trigger_log_risk_insert
    AFTER INSERT ON risks
    FOR EACH ROW
    EXECUTE FUNCTION log_risk_changes();

CREATE TRIGGER trigger_log_risk_update
    AFTER UPDATE ON risks
    FOR EACH ROW
    EXECUTE FUNCTION log_risk_changes();

CREATE TRIGGER trigger_log_risk_delete
    AFTER DELETE ON risks
    FOR EACH ROW
    EXECUTE FUNCTION log_risk_changes();

-- Add comment
COMMENT ON FUNCTION log_risk_changes() IS 'Function to log all changes (INSERT, UPDATE, DELETE) to the risks table';