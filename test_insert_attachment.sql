-- Teste de inserção de anexo para verificar se o trigger funciona

-- 1. Buscar um projeto existente para usar no teste
DO $$
DECLARE
    test_project_id UUID;
    test_user_id UUID;
    attachment_id UUID;
    logs_before INTEGER;
    logs_after INTEGER;
BEGIN
    -- Buscar um projeto existente
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    -- Buscar um usuário existente
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    -- Se não encontrou projeto ou usuário, criar dados de teste
    IF test_project_id IS NULL THEN
        RAISE NOTICE 'Nenhum projeto encontrado. Criando projeto de teste...';
        INSERT INTO projects (id, name, description, status, created_by)
        VALUES (gen_random_uuid(), 'Projeto Teste Trigger', 'Projeto para testar triggers', 'active', COALESCE(test_user_id, gen_random_uuid()))
        RETURNING id INTO test_project_id;
    END IF;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Nenhum usuário encontrado. Usando UUID genérico...';
        test_user_id := gen_random_uuid();
    END IF;
    
    RAISE NOTICE 'Usando projeto: % e usuário: %', test_project_id, test_user_id;
    
    -- Contar logs antes da inserção
    SELECT COUNT(*) INTO logs_before FROM project_logs WHERE table_name = 'attachments';
    RAISE NOTICE 'Logs de attachments antes: %', logs_before;
    
    -- Inserir um anexo de teste
    INSERT INTO attachments (
        id,
        project_id,
        user_id,
        name,
        url,
        file_type
    ) VALUES (
        gen_random_uuid(),
        test_project_id,
        test_user_id,
        'teste-trigger.txt',
        'https://example.com/teste-trigger.txt',
        'text/plain'
    ) RETURNING id INTO attachment_id;
    
    RAISE NOTICE 'Anexo inserido com ID: %', attachment_id;
    
    -- Aguardar um pouco para garantir que o trigger foi executado
    PERFORM pg_sleep(1);
    
    -- Contar logs após a inserção
    SELECT COUNT(*) INTO logs_after FROM project_logs WHERE table_name = 'attachments';
    RAISE NOTICE 'Logs de attachments depois: %', logs_after;
    
    -- Verificar se o log foi criado
    IF logs_after > logs_before THEN
        RAISE NOTICE 'SUCCESS: Trigger funcionou! Log foi criado.';
        
        -- Mostrar o log criado
        RAISE NOTICE 'Log criado: verificar na tabela project_logs com record_id = %', attachment_id;
    ELSE
        RAISE NOTICE 'ERROR: Trigger não funcionou! Nenhum log foi criado.';
    END IF;
    
    -- Limpar dados de teste
    DELETE FROM attachments WHERE id = attachment_id;
    DELETE FROM project_logs WHERE record_id = attachment_id;
    
    RAISE NOTICE 'Dados de teste removidos.';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRO durante o teste: %', SQLERRM;
END;
$$;