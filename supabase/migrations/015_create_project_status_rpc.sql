-- Remover função existente se houver
DROP FUNCTION IF EXISTS get_kanban_project_status_data(UUID, TEXT[]);
DROP FUNCTION IF EXISTS get_kanban_project_status_data(UUID);

-- Criar função RPC para dados de status de projetos
CREATE OR REPLACE FUNCTION get_kanban_project_status_data(
  p_team_id UUID,
  p_priority_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  status TEXT,
  status_label TEXT,
  projects JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.status,
    CASE 
      WHEN s.status = 'planning' THEN 'Planejamento'
      WHEN s.status = 'active' THEN 'Ativo'
      WHEN s.status = 'on_hold' THEN 'Em Espera'
      WHEN s.status = 'completed' THEN 'Concluído'
      WHEN s.status = 'cancelled' THEN 'Cancelado'
      ELSE s.status
    END as status_label,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'priority', p.priority,
          'status', p.status,
          'start_date', p.start_date,
          'end_date', p.end_date,
          'progress', COALESCE(p.progress, 0),
          'total_tasks', COALESCE(task_counts.total_tasks, 0),
          'completed_tasks', COALESCE(task_counts.completed_tasks, 0)
        )
        ORDER BY p.created_at DESC
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'::jsonb
    ) as projects
  FROM (
    SELECT unnest(ARRAY['planning', 'active', 'on_hold', 'completed', 'cancelled']) as status
  ) s
  LEFT JOIN projects p ON p.status = s.status 
    AND p.team_id = p_team_id
    AND (p_priority_filter IS NULL OR p.priority = ANY(p_priority_filter))
    AND p.deleted_at IS NULL
  LEFT JOIN (
    SELECT 
      t.project_id,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE t.status = 'completed') as completed_tasks
    FROM tasks t
    WHERE t.deleted_at IS NULL
    GROUP BY t.project_id
  ) task_counts ON task_counts.project_id = p.id
  GROUP BY s.status
  ORDER BY 
    CASE s.status
      WHEN 'planning' THEN 1
      WHEN 'active' THEN 2
      WHEN 'on_hold' THEN 3
      WHEN 'completed' THEN 4
      WHEN 'cancelled' THEN 5
      ELSE 6
    END;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_kanban_project_status_data(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_kanban_project_status_data(UUID, TEXT[]) TO anon;