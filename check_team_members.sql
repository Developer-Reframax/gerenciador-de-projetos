-- Verificar todos os membros dos times
SELECT 
  t.name as team_name,
  t.id as team_id,
  tm.id as member_id,
  tm.role,
  tm.status,
  tm.user_id,
  tm.created_at
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
ORDER BY t.name, tm.created_at;

-- Contar membros por time (incluindo inativos)
SELECT 
  t.name as team_name,
  t.id as team_id,
  COUNT(tm.id) as total_members,
  COUNT(CASE WHEN tm.status = 'active' THEN 1 END) as active_members,
  COUNT(CASE WHEN tm.status != 'active' THEN 1 END) as inactive_members
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- Verificar se há membros duplicados ou com problemas
SELECT 
  team_id,
  user_id,
  COUNT(*) as count
FROM team_members
GROUP BY team_id, user_id
HAVING COUNT(*) > 1;