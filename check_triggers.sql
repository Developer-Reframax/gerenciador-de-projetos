-- Verificar triggers ativos na tabela attachments
SELECT 
    n.nspname as schema_name, 
    c.relname as table_name, 
    t.tgname as trigger_name, 
    t.tgtype,
    p.prosrc as function_source
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
JOIN pg_namespace n ON c.relnamespace = n.oid 
LEFT JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'attachments' AND n.nspname = 'public';

-- Verificar se a tabela project_logs existe e sua estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'project_logs'
ORDER BY ordinal_position;

-- Verificar se a função create_project_log existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'create_project_log';

-- Buscar um projeto existente para usar no teste
SELECT id, name FROM projects LIMIT 1;

-- Buscar um usuário existente para usar no teste
SELECT id, email FROM auth.users LIMIT 1;

-- Verificar se o log foi inserido
SELECT * FROM project_logs WHERE description = 'Teste manual de log';