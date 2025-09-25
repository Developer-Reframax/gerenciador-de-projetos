-- Teste simples do sistema de logs para projetos
-- Execute este arquivo para verificar se os triggers estão funcionando

-- 1. Verificar logs existentes para projetos
SELECT 
    COUNT(*) as total_logs_projetos,
    COUNT(CASE WHEN action_type = 'INSERT' THEN 1 END) as inserts,
    COUNT(CASE WHEN action_type = 'UPDATE' THEN 1 END) as updates,
    COUNT(CASE WHEN action_type = 'DELETE' THEN 1 END) as deletes
FROM project_logs 
WHERE table_name = 'projects';

-- 2. Verificar os últimos 5 logs de projetos
SELECT 
    pl.action_type,
    pl.description,
    pl.created_at,
    pl.new_data->>'name' as nome_projeto,
    pl.new_data->>'status' as status_projeto,
    pl.old_data->>'status' as status_anterior
FROM project_logs pl
WHERE pl.table_name = 'projects'
ORDER BY pl.created_at DESC
LIMIT 5;

-- 3. Verificar se a função log_project_changes existe
SELECT 
    proname as nome_funcao,
    prosrc as codigo_funcao
FROM pg_proc 
WHERE proname = 'log_project_changes';

-- 4. Verificar se os triggers existem
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'projects'
  AND trigger_name LIKE '%log_project%'
ORDER BY trigger_name;

-- 5. Teste prático: Atualizar um projeto existente (se houver)
DO $$
DECLARE
    test_project_id uuid;
    logs_antes integer;
    logs_depois integer;
BEGIN
    -- Contar logs antes
    SELECT COUNT(*) INTO logs_antes FROM project_logs WHERE table_name = 'projects';
    
    -- Tentar encontrar um projeto para atualizar
    SELECT id INTO test_project_id FROM projects WHERE is_active = true LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Fazer uma pequena atualização
        UPDATE projects 
        SET updated_at = NOW()
        WHERE id = test_project_id;
        
        -- Contar logs depois
        SELECT COUNT(*) INTO logs_depois FROM project_logs WHERE table_name = 'projects';
        
        RAISE NOTICE 'Teste realizado:';
        RAISE NOTICE 'Logs antes: %', logs_antes;
        RAISE NOTICE 'Logs depois: %', logs_depois;
        RAISE NOTICE 'Projeto testado: %', test_project_id;
        
        IF logs_depois > logs_antes THEN
            RAISE NOTICE 'SUCCESS: Sistema de logs funcionando corretamente!';
        ELSE
            RAISE NOTICE 'WARNING: Nenhum log foi criado durante o teste';
        END IF;
    ELSE
        RAISE NOTICE 'Nenhum projeto ativo encontrado para teste';
    END IF;
END $$;