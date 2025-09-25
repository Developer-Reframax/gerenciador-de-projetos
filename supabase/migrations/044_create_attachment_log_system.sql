-- Create specific logging system for attachments table
-- This function will handle INSERT and DELETE operations on attachments

-- Create the attachment logging function
CREATE OR REPLACE FUNCTION log_attachment_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT operations
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
            'attachments',
            NEW.id,
            'INSERT',
            NEW.uploaded_by,
            to_jsonb(NEW),
            'Arquivo "' || COALESCE(NEW.original_filename, NEW.filename) || '" foi adicionado ao projeto'
        );
        RETURN NEW;
    END IF;
    
    -- Handle DELETE operations
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
            'attachments',
            OLD.id,
            'DELETE',
            -- For DELETE, we need to get the current user from auth.uid() since OLD doesn't have current user context
            COALESCE(auth.uid(), OLD.uploaded_by),
            to_jsonb(OLD),
            'Arquivo "' || COALESCE(OLD.original_filename, OLD.filename) || '" foi removido do projeto'
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for INSERT and DELETE operations on attachments
CREATE TRIGGER trigger_attachment_insert_log
    AFTER INSERT ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION log_attachment_changes();

CREATE TRIGGER trigger_attachment_delete_log
    AFTER DELETE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION log_attachment_changes();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_attachment_changes() TO authenticated;
GRANT EXECUTE ON FUNCTION log_attachment_changes() TO anon;