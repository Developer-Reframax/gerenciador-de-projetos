-- Análise detalhada dos membros do projeto
-- Projeto ID: 07816d0b-d1df-486d-9a76-80b061b93c8c

-- 1. Verificar informações do projeto
SELECT 'PROJETO' as tipo, id, name, team_id, owner_id 
FROM projects 
WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c';

-- 2. Verificar TODOS os registros na tabela team_members para este team_id
SELECT 'TODOS_MEMBROS' as tipo, tm.*, u.full_name, u.email
FROM team_members tm
LEFT JOIN users u ON tm.user_id = u.id
WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c')
ORDER BY tm.created_at;

-- 3. Verificar membros ATIVOS (sem filtros de status)
SELECT 'MEMBROS_ATIVOS' as tipo, tm.user_id, tm.role, tm.status, tm.deleted_at, u.full_name, u.email
FROM team_members tm
JOIN users u ON tm.user_id = u.id
WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c')
AND tm.deleted_at IS NULL;

-- 4. Simular exatamente a consulta da API atual
SELECT 'API_SIMULATION' as tipo, tm.user_id, tm.role, u.id, u.full_name, u.email, u.avatar_url
FROM team_members tm
JOIN users u ON tm.user_id = u.id
WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c')
AND tm.status != 'inactive'
AND tm.status != 'blocked'
AND tm.deleted_at IS NULL;

-- 5. Verificar se há problema com o status
SELECT 'STATUS_CHECK' as tipo, status, COUNT(*) as quantidade
FROM team_members
WHERE team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c')
GROUP BY status;