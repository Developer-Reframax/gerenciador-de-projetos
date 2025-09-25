-- Debug específico para o projeto 07816d0b-d1df-486d-9a76-80b061b93c8c

-- 1. Verificar o projeto e seu team_id
SELECT 'PROJETO INFO' as step, id, name, team_id, owner_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c';

-- 2. Verificar todos os membros da equipe (incluindo status)
SELECT 
    'TODOS OS MEMBROS' as step,
    tm.user_id, 
    tm.role, 
    tm.status,
    tm.created_at,
    u.full_name, 
    u.email,
    u.is_active as user_active
FROM team_members tm 
JOIN users u ON tm.user_id = u.id 
WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c')
ORDER BY tm.role, tm.created_at;

-- 3. Verificar apenas membros ativos
SELECT 
    'MEMBROS ATIVOS' as step,
    tm.user_id, 
    tm.role, 
    tm.status,
    u.full_name, 
    u.email
FROM team_members tm 
JOIN users u ON tm.user_id = u.id 
WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c')
  AND tm.status = 'active'
ORDER BY tm.role;

-- 4. Verificar se o owner do projeto está na equipe
SELECT 
    'OWNER INFO' as step,
    p.id as project_id,
    p.name as project_name,
    p.owner_id,
    u.full_name as owner_name,
    u.email as owner_email,
    tm.role as role_in_team,
    tm.status as status_in_team
FROM projects p
JOIN users u ON p.owner_id = u.id
LEFT JOIN team_members tm ON tm.user_id = p.owner_id AND tm.team_id = p.team_id
WHERE p.id = '07816d0b-d1df-486d-9a76-80b061b93c8c';

-- 5. Contar total de membros por status
SELECT 
    'CONTAGEM POR STATUS' as step,
    tm.status,
    COUNT(*) as total
FROM team_members tm 
WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c')
GROUP BY tm.status
ORDER BY tm.status;