-- Verificar todos os projetos no banco de dados
-- Esta consulta vai nos ajudar a entender por que apenas 1 projeto está sendo retornado

-- 1. Ver todos os projetos na tabela
SELECT 
  id, 
  name, 
  status, 
  is_active, 
  deleted_at,
  created_at
FROM projects 
ORDER BY created_at;

-- 2. Verificar projetos que atendem aos critérios da API
SELECT 
  id, 
  name, 
  status, 
  is_active, 
  deleted_at
FROM projects 
WHERE status = 'active' AND deleted_at IS NULL
ORDER BY name;

-- 3. Contar projetos por status
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as not_deleted
FROM projects 
GROUP BY status;

-- 4. Verificar se há projetos com is_active = false
SELECT 
  id, 
  name, 
  status, 
  is_active, 
  deleted_at
FROM projects 
WHERE is_active = false OR deleted_at IS NOT NULL;

-- 5. Executar a mesma query que a API usa
SELECT id, name FROM projects 
WHERE status = 'active' AND deleted_at IS NULL 
ORDER BY name;