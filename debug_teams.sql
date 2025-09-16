-- Verificar todos os times cadastrados
SELECT 
    t.id,
    t.name,
    t.description,
    t.owner_id,
    t.created_at
FROM teams t
WHERE t.deleted_at IS NULL
ORDER BY t.created_at;

-- Verificar todos os membros dos times
SELECT 
    tm.id,
    tm.team_id,
    tm.user_id,
    tm.role,
    tm.status,
    tm.joined_at,
    tm.deleted_at,
    t.name as team_name
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
WHERE tm.deleted_at IS NULL
ORDER BY t.name, tm.role, tm.joined_at;

-- Contar membros por time
SELECT 
    t.name as team_name,
    t.id as team_id,
    COUNT(tm.id) as total_members,
    COUNT(CASE WHEN tm.status = 'active' THEN 1 END) as active_members,
    COUNT(CASE WHEN tm.status = 'pending' THEN 1 END) as pending_members
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.deleted_at IS NULL
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.name
ORDER BY t.name;

-- Verificar membros ativos por time (mesma lógica da API)
SELECT 
    t.name as team_name,
    tm.user_id,
    tm.role,
    tm.status,
    u.email
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id 
    AND tm.deleted_at IS NULL 
    AND tm.status = 'active'
LEFT JOIN auth.users u ON tm.user_id = u.id
WHERE t.deleted_at IS NULL
ORDER BY t.name, tm.role;