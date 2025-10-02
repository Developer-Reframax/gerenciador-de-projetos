-- Migration: Fix deviation log function
-- Description: Remove references to requested_by field that was removed from project_deviations table
-- Date: 2024

-- Drop existing function and recreate without requested_by references
CREATE OR REPLACE FUNCTION log_deviation_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations
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
            'project_deviations',
            NEW.id,
            'INSERT',
            auth.uid(),
            jsonb_build_object(
                'id', NEW.id,
                'project_id', NEW.project_id,
                'description', NEW.description,
                'was_requested', NEW.was_requested,
                'evaluation_criteria', NEW.evaluation_criteria,
                'impact_type', NEW.impact_type,
                'requires_approval', NEW.requires_approval,
                'approver_id', NEW.approver_id,
                'status', NEW.status,
                'approval_notes', NEW.approval_notes,
                'created_at', NEW.created_at
            ),
            'Desvio criado: ' || NEW.description
        );
        RETURN NEW;
    END IF;

    -- For UPDATE operations
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
            'project_deviations',
            NEW.id,
            'UPDATE',
            auth.uid(),
            jsonb_build_object(
                'id', OLD.id,
                'project_id', OLD.project_id,
                'description', OLD.description,
                'was_requested', OLD.was_requested,
                'evaluation_criteria', OLD.evaluation_criteria,
                'impact_type', OLD.impact_type,
                'requires_approval', OLD.requires_approval,
                'approver_id', OLD.approver_id,
                'status', OLD.status,
                'approval_notes', OLD.approval_notes,
                'updated_at', OLD.updated_at
            ),
            jsonb_build_object(
                'id', NEW.id,
                'project_id', NEW.project_id,
                'description', NEW.description,
                'was_requested', NEW.was_requested,
                'evaluation_criteria', NEW.evaluation_criteria,
                'impact_type', NEW.impact_type,
                'requires_approval', NEW.requires_approval,
                'approver_id', NEW.approver_id,
                'status', NEW.status,
                'approval_notes', NEW.approval_notes,
                'updated_at', NEW.updated_at
            ),
            'Desvio atualizado: ' || NEW.description ||
            CASE 
                WHEN OLD.status != NEW.status THEN ' (Status: ' || OLD.status || ' → ' || NEW.status || ')'
                ELSE ''
            END
        );
        RETURN NEW;
    END IF;

    -- For DELETE operations
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
            'project_deviations',
            OLD.id,
            'DELETE',
            auth.uid(),
            jsonb_build_object(
                'id', OLD.id,
                'project_id', OLD.project_id,
                'description', OLD.description,
                'was_requested', OLD.was_requested,
                'evaluation_criteria', OLD.evaluation_criteria,
                'impact_type', OLD.impact_type,
                'requires_approval', OLD.requires_approval,
                'approver_id', OLD.approver_id,
                'status', OLD.status,
                'approval_notes', OLD.approval_notes
            ),
            'Desvio removido: ' || OLD.description
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment to reflect the fix
COMMENT ON FUNCTION log_deviation_changes() IS 'Function to log all changes (INSERT, UPDATE, DELETE) in project_deviations table to project_logs - Fixed to remove requested_by field references';