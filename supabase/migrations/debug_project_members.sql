-- Debug do projeto específico
SELECT 'PROJECT INFO' as debug_step, id, name, team_id 
FROM projects 
WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c';

-- Verificar todos os membros da equipe
SELECT 'TEAM MEMBERS' as debug_step, tm.user_id, tm.role, tm.status, u.full_name, u.email 
FROM team_members tm 
JOIN users u ON tm.user_id = u.id 
WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c');

-- Verificar a consulta exata que a API está fazendo
SELECT 'API QUERY SIMULATION' as debug_step, tm.user_id, tm.role, u.id, u.full_name, u.email, u.avatar_url
FROM team_members tm
JOIN users u ON tm.user_id = u.id
WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c');