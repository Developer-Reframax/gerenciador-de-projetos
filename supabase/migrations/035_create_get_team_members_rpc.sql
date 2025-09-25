-- Função RPC para buscar membros da equipe com dados dos usuários
CREATE OR REPLACE FUNCTION get_team_members_with_users(team_id_param UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT,
  joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.email,
    u.avatar_url,
    tm.role,
    tm.joined_at
  FROM team_members tm
  INNER JOIN users u ON tm.user_id = u.id
  WHERE tm.team_id = team_id_param
  ORDER BY tm.joined_at ASC;
END;
$$;

-- Conceder permissões para roles autenticados
GRANT EXECUTE ON FUNCTION get_team_members_with_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_members_with_users(UUID) TO anon;