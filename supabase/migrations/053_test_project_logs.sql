-- Teste do sistema de logs para a tabela projects
-- Este arquivo testa se os triggers estão funcionando corretamente

-- Primeiro, vamos verificar se existem logs antes do teste
SELECT COUNT(*) as logs_antes_teste FROM project_logs WHERE table_name = 'projects';

-- Teste 1: INSERT - Criar um projeto de teste
INSERT INTO projects (
    name,
    description,
    status,
    priority,
    owner_id,
    start_date,
    due_date,
    budget,
    progress_percentage,
    visibility,
    is_active
) VALUES (
    'Projeto Teste Logs',
    'Projeto criado para testar o sistema de logs',
    'planning',
    'medium',
    (SELECT id FROM users LIMIT 1), -- Usar o primeiro usuário disponível
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    50000.00,
    0,
    'public',
    true
);

-- Capturar o ID do projeto criado
DO $$
DECLARE
    test_project_id uuid;
BEGIN
    -- Obter o ID do projeto de teste
    SELECT id INTO test_project_id 
    FROM projects 
    WHERE name = 'Projeto Teste Logs' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Verificar se o log de INSERT foi criado
    RAISE NOTICE 'Projeto criado com ID: %', test_project_id;
    
    -- Teste 2: UPDATE - Atualizar o projeto
    UPDATE projects 
    SET 
        status = 'in_progress',
        priority = 'high',
        progress_percentage = 25,
        description = 'Projeto atualizado para testar logs de UPDATE'
    WHERE id = test_project_id;
    
    -- Teste 3: Outro UPDATE - Alterar apenas o progresso
    UPDATE projects 
    SET progress_percentage = 50
    WHERE id = test_project_id;
    
    -- Verificar os logs criados
    RAISE NOTICE 'Verificando logs criados para o projeto %', test_project_id;
END $$;

-- Consultar os logs criados durante o teste
SELECT 
    pl.id,
    pl.project_id,
    pl.action_type,
    pl.description,
    pl.created_at,
    pl.old_data->>'status' as status_anterior,
    pl.new_data->>'status' as status_novo,
    pl.old_data->>'priority' as prioridade_anterior,
    pl.new_data->>'priority' as prioridade_nova,
    pl.old_data->>'progress_percentage' as progresso_anterior,
    pl.new_data->>'progress_percentage' as progresso_novo
FROM project_logs pl
JOIN projects p ON pl.project_id = p.id
WHERE p.name = 'Projeto Teste Logs'
ORDER BY pl.created_at;

-- Teste 4: DELETE - Remover o projeto de teste
DELETE FROM projects WHERE name = 'Projeto Teste Logs';

-- Verificar o log de DELETE
SELECT 
    pl.id,
    pl.project_id,
    pl.action_type,
    pl.description,
    pl.created_at,
    pl.old_data->>'name' as nome_projeto_deletado,
    pl.old_data->>'status' as status_final
FROM project_logs pl
WHERE pl.table_name = 'projects' 
  AND pl.action_type = 'DELETE'
  AND pl.old_data->>'name' = 'Projeto Teste Logs'
ORDER BY pl.created_at DESC
LIMIT 1;

-- Contar total de logs criados durante o teste
SELECT COUNT(*) as total_logs_teste 
FROM project_logs 
WHERE table_name = 'projects' 
  AND (old_data->>'name' = 'Projeto Teste Logs' OR new_data->>'name' = 'Projeto Teste Logs');

-- Verificar se todos os tipos de ação foram registrados
SELECT 
    action_type,
    COUNT(*) as quantidade
FROM project_logs 
WHERE table_name = 'projects' 
  AND (old_data->>'name' = 'Projeto Teste Logs' OR new_data->>'name' = 'Projeto Teste Logs')
GROUP BY action_type
ORDER BY action_type;