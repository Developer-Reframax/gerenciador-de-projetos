-- Query para verificar todos os projetos
SELECT id, name, status, is_active, deleted_at, created_at 
FROM projects 
ORDER BY created_at DESC;

-- Query para verificar projetos ativos (mesma que a API usa)
SELECT id, name, status, is_active, deleted_at 
FROM projects 
WHERE status = 'active' AND deleted_at IS NULL 
ORDER BY name;