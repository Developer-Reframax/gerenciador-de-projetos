-- Teste dos triggers de notificações
-- Este arquivo pode ser executado no Supabase SQL Editor para testar os triggers

-- 1. Verificar se os triggers existem
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE 'trigger_notify_%'
ORDER BY event_object_table, trigger_name;

-- 2. Verificar se as funções dos triggers existem
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'notify_%'
ORDER BY routine_name;

-- 3. Teste básico - inserir um comentário em um projeto (se existir)
-- NOTA: Execute apenas se houver projetos e usuários na base
/*
INSERT INTO comments (
    context,
    context_id,
    author_id,
    content
) VALUES (
    'project',
    (SELECT id FROM projects LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'Teste de comentário para verificar trigger de notificações'
);
*/

-- 4. Verificar notificações criadas
SELECT 
    id,
    user_id,
    type,
    message,
    created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;