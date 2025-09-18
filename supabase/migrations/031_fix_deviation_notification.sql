-- Fix deviation notification function to remove generates_impediment reference

CREATE OR REPLACE FUNCTION notify_deviation_created()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  team_member RECORD;
  creator_name TEXT;
BEGIN
  -- Buscar informações do projeto
  SELECT p.id, p.name, p.team_id
  INTO project_record
  FROM projects p
  WHERE p.id = NEW.project_id;
  
  -- Buscar nome do criador do desvio
  SELECT full_name INTO creator_name FROM users WHERE id = NEW.requested_by;
  
  -- Notificar todos os membros da equipe
  FOR team_member IN 
    SELECT user_id FROM team_members WHERE team_id = project_record.team_id
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      message
    ) VALUES (
      team_member.user_id,
      'deviation',
      'Um desvio foi cadastrado no projeto "' || COALESCE(project_record.name, 'Projeto') || '". Critério: ' || NEW.evaluation_criteria || '. Impacto: ' || NEW.impact_type || '.'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;