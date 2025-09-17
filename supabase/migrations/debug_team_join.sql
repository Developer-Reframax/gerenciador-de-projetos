-- Verificar o problema do INNER JOIN com teams
-- Esta consulta vai mostrar por que apenas 1 projeto está sendo retornado

-- 1. Ver todos os projetos ativos
SELECT 
  id, 
  name, 
  status, 
  team_id,
  deleted_at
FROM projects 
WHERE status = 'active' AND deleted_at IS NULL
ORDER BY name;

-- 2. Ver quais projetos têm team_id NULL
SELECT 
  id, 
  name, 
  status, 
  team_id,
  'SEM TEAM' as problema
FROM projects 
WHERE status = 'active' AND deleted_at IS NULL AND team_id IS NULL
ORDER BY name;

-- 3. Simular a query da API com INNER JOIN (que está causando o problema)
SELECT 
  p.id,
  p.name,
  p.description,
  p.status,
  p.team_id,
  t.name as team_name
FROM projects p
INNER JOIN teams t ON p.team_id = t.id
WHERE p.status = 'active' AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;

-- 4. Query corrigida com LEFT JOIN (que deveria ser usada)
SELECT 
  p.id,
  p.name,
  p.description,
  p.status,
  p.team_id,
  t.name as team_name
FROM projects p
LEFT JOIN teams t ON p.team_id = t.id
WHERE p.status = 'active' AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;