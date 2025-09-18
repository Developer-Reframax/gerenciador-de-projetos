-- Fix task priority enum value in notification function
-- Replace 'Não definida' with 'medium' which is a valid enum value

CREATE OR REPLACE FUNCTION notify_new_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if task is assigned to someone
    IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            reference_type,
            reference_id,
            project_id
        ) VALUES (
            NEW.assigned_to,
            'task_assigned',
            'Nova tarefa atribuída',
            'Você foi designado para a tarefa "' || NEW.title || '" com prioridade ' || COALESCE(NEW.priority, 'medium') || '.',
            'task',
            NEW.id,
            NEW.project_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;