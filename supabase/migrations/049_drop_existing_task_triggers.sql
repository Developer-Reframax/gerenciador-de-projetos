-- Remover triggers existentes da tabela tasks para recriar com estrutura correta

DROP TRIGGER IF EXISTS task_insert_log_trigger ON tasks;
DROP TRIGGER IF EXISTS task_update_log_trigger ON tasks;
DROP TRIGGER IF EXISTS task_delete_log_trigger ON tasks;

-- Remover função existente
DROP FUNCTION IF EXISTS log_task_changes();