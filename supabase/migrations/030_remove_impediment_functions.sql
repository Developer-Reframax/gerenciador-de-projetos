-- Remove functions and triggers that reference generates_impediment

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_update_project_status_on_deviation ON project_deviations;

-- Drop the function that handles project status updates based on impediments
DROP FUNCTION IF EXISTS update_project_status_on_deviation();

-- Update the notification trigger function to remove generates_impediment reference
CREATE OR REPLACE FUNCTION notify_deviation_created()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  user_record RECORD;
BEGIN
  -- Get project information
  SELECT name INTO project_record FROM projects WHERE id = NEW.project_id;
  
  -- Notify all project team members about the new deviation
  FOR user_record IN 
    SELECT DISTINCT u.id, u.email, u.full_name
    FROM users u
    JOIN project_team pt ON u.id = pt.user_id
    WHERE pt.project_id = NEW.project_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES (
      user_record.id,
      'Novo Desvio Cadastrado',
      'Um desvio foi cadastrado no projeto "' || COALESCE(project_record.name, 'Projeto') || '". Critério: ' || NEW.evaluation_criteria || '. Impacto: ' || NEW.impact_type || '.',
      'info',
      NEW.id,
      'deviation'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger for notifications only
DROP TRIGGER IF EXISTS trigger_notify_deviation_created ON project_deviations;

CREATE TRIGGER trigger_notify_deviation_created
  AFTER INSERT ON project_deviations
  FOR EACH ROW
  EXECUTE FUNCTION notify_deviation_created();