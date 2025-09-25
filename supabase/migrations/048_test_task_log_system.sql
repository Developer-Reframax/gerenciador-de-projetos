-- Teste do sistema de logs para tasks
-- Este teste verifica se os logs são criados corretamente para INSERT, UPDATE e DELETE

-- Inserir uma task de teste
INSERT INTO tasks (
  project_id,
  title,
  description,
  priority,
  status,
  reporter_id
) VALUES (
  (SELECT id FROM projects LIMIT 1), -- Usar um projeto existente
  'Task de Teste para Logs',
  'Esta é uma task criada para testar o sistema de logs',
  'medium',
  'todo',
  '00000000-0000-0000-0000-000000000001' -- UUID de teste
);

-- Atualizar a task
UPDATE tasks 
SET 
  status = 'in_progress',
  priority = 'high',
  description = 'Task atualizada para testar logs de UPDATE'
WHERE title = 'Task de Teste para Logs';

-- Excluir a task
DELETE FROM tasks WHERE title = 'Task de Teste para Logs';

-- Verificar se os logs foram criados (deve retornar 3 registros)
SELECT 
  action_type,
  table_name,
  new_data->>'title' as task_title,
  description,
  created_at
FROM project_logs 
WHERE table_name = 'tasks' 
  AND (new_data->>'title' = 'Task de Teste para Logs' OR old_data->>'title' = 'Task de Teste para Logs')
ORDER BY created_at DESC;