-- Debug da API de membros para o projeto 07816d0b-d1df-486d-9a76-80b061b93c8c

-- 1. Verificar o projeto e seu team_id
SELECT id, name, team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c';

-- 2. Verificar todos os membros da equipe
SELECT tm.user_id, tm.role, tm.status, u.full_name, u.email 
FROM team_members tm 
JOIN users u ON tm.user_id = u.id 
WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c');

-- 3. Verificar se há filtros de status que podem estar limitando os resultados
SELECT tm.*, u.full_name, u.email 
FROM team_members tm 
JOIN users u ON tm.user_id = u.id 
WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c')
ORDER BY tm.role;

-- 4. Verificar a consulta exata que a API está fazendo
SELECT 
  tm.user_id,
  tm.role,
  u.id,
  u.full_name,
  u.email,
  u.avatar_url
FROM team_members tm
JOIN users u ON tm.user_id = u.id
WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = '07816d0b-d1df-486d-9a76-80b061b93c8c');