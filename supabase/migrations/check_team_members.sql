-- Check team_members data
SELECT 
  tm.id,
  tm.team_id,
  tm.user_id,
  tm.role,
  tm.status,
  tm.joined_at,
  au.email as user_email,
  t.name as team_name
FROM team_members tm
JOIN auth.users au ON tm.user_id = au.id
JOIN teams t ON tm.team_id = t.id
ORDER BY tm.created_at DESC;

-- Check teams data
SELECT id, name, created_at FROM teams ORDER BY created_at DESC;

-- Check auth users data
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;