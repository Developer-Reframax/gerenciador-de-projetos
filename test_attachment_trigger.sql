-- Teste específico para verificar se o trigger de attachments está funcionando

-- 1. Verificar se existem projetos
SELECT 'Projetos existentes:' as info;
SELECT id, name FROM projects LIMIT 3;

-- 2. Verificar se existem usuários
SELECT 'Usuários existentes:' as info;
SELECT id, email FROM auth.users LIMIT 3;

-- 3. Verificar se o trigger existe
SELECT 'Trigger de attachments:' as info;
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'attachments'
AND t.tgname = 'trigger_attachments_log';

-- 4. Verificar se a função create_project_log existe
SELECT 'Função create_project_log:' as info;
SELECT proname, prosrc FROM pg_proc WHERE proname = 'create_project_log';

-- 5. Verificar estrutura da tabela project_logs
SELECT 'Estrutura da tabela project_logs:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'project_logs' 
ORDER BY ordinal_position;

-- 6. Contar logs existentes antes do teste
SELECT 'Logs existentes antes do teste:' as info;
SELECT COUNT(*) as total_logs FROM project_logs;

-- 7. Verificar se há logs de attachments
SELECT 'Logs de attachments existentes:' as info;
SELECT COUNT(*) as attachment_logs FROM project_logs WHERE table_name = 'attachments';

-- 8. Verificar últimos logs
SELECT 'Últimos 5 logs:' as info;
SELECT 
    table_name,
    action_type,
    description,
    created_at
FROM project_logs 
ORDER BY created_at DESC 
LIMIT 5;