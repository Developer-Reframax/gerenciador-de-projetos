-- Verificar se há logs na tabela project_logs
SELECT 
    COUNT(*) as total_logs,
    table_name,
    action_type,
    MAX(created_at) as last_log
FROM project_logs 
GROUP BY table_name, action_type 
ORDER BY table_name, action_type;

-- Verificar logs específicos de attachments
SELECT 
    id,
    project_id,
    table_name,
    action_type,
    description,
    created_at
FROM project_logs 
WHERE table_name = 'attachments'
ORDER BY created_at DESC
LIMIT 10;