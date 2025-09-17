-- Verificar todos os projetos na tabela
SELECT 
  id, 
  name, 
  status, 
  is_active, 
  deleted_at,
  created_at
FROM projects 
ORDER BY created_at DESC;

-- Verificar projetos que atendem aos critérios da API
SELECT 
  id, 
  name, 
  status, 
  is_active, 
  deleted_at
FROM projects 
WHERE status = 'active' 
  AND deleted_at IS NULL 
ORDER BY created_at DESC;

-- Contar total de projetos
SELECT COUNT(*) as total_projects FROM projects;

-- Contar projetos ativos
SELECT COUNT(*) as active_projects 
FROM projects 
WHERE status = 'active' 
  AND deleted_at IS NULL;