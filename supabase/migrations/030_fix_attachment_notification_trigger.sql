-- =====================================================
-- Correção do trigger de notificação para anexos
-- =====================================================
-- Problema: O trigger estava tentando acessar campos que não existem mais
-- na estrutura atual da tabela attachments (context_type, context_id, uploaded_by, original_filename)
-- Solução: Atualizar para usar os campos corretos (project_id, user_id, name)

CREATE OR REPLACE FUNCTION notify_attachment_added()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  team_member RECORD;
  uploader_name TEXT;
BEGIN
  -- Buscar informações do projeto usando project_id diretamente
  SELECT p.id, p.name, p.team_id
  INTO project_record
  FROM projects p
  WHERE p.id = NEW.project_id;
  
  -- Buscar nome do usuário que fez upload
  SELECT full_name INTO uploader_name FROM users WHERE id = NEW.uploaded_by;
  
  -- Notificar todos os membros da equipe (exceto quem fez upload)
  FOR team_member IN 
    SELECT user_id FROM team_members 
    WHERE team_id = project_record.team_id AND user_id != NEW.uploaded_by
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      message
    ) VALUES (
      team_member.user_id,
      'attachment',
      COALESCE(uploader_name, 'Um usuário') || ' adicionou o anexo "' || COALESCE(NEW.original_filename, 'arquivo') || '" no projeto "' || COALESCE(project_record.name, 'Projeto') || '"'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário: A função foi corrigida para usar:
-- - NEW.project_id em vez de NEW.context_id
-- - NEW.uploaded_by (campo correto da tabela)
-- - NEW.original_filename (campo correto da tabela)
-- - Removida a verificação NEW.context_type = 'project' pois todos os anexos são de projetos