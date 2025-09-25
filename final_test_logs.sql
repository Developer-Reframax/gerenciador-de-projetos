-- Teste final para verificar se os logs de attachments estão funcionando

-- Verificar logs de attachments criados recentemente
SELECT 'Logs de attachments dos últimos minutos:' as info;
SELECT 
    id,
    project_id,
    table_name,
    record_id,
    action_type,
    description,
    user_id,
    created_at
FROM project_logs 
WHERE table_name = 'attachments'
AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- Verificar total de logs de attachments
SELECT 'Total de logs de attachments:' as info;
SELECT COUNT(*) as total FROM project_logs WHERE table_name = 'attachments';

-- Verificar se o trigger está ativo
SELECT 'Status do trigger:' as info;
SELECT 
    t.tgname as trigger_name,
    CASE t.tgenabled 
        WHEN 'O' THEN 'Ativo'
        WHEN 'D' THEN 'Desabilitado'
        ELSE 'Outro status'
    END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'attachments'
AND t.tgname = 'trigger_attachments_log';

-- Verificar últimos logs gerais
SELECT 'Últimos 10 logs gerais:' as info;
SELECT 
    table_name,
    action_type,
    description,
    created_at
FROM project_logs 
ORDER BY created_at DESC 
LIMIT 10;