-- Consulta para verificar os valores de status existentes na tabela projects
SELECT 
  status,
  COUNT(*) as count
FROM projects 
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;

-- Consulta para ver projetos específicos com seus status
SELECT 
  id,
  name,
  status,
  created_at
FROM projects 
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;