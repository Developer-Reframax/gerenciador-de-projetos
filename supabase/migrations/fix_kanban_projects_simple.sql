-- Simplificar função get_gantt_projects para retornar todos os projetos ativos
-- Remover filtros complexos desnecessários

-- Drop existing function
DROP FUNCTION IF EXISTS get_gantt_projects(text[], text[], text, text, text);

-- Create simplified function without complex filters
CREATE OR REPLACE FUNCTION get_gantt_projects(
    p_status text[] DEFAULT NULL,
    p_priority text[] DEFAULT NULL,
    p_team_id text DEFAULT NULL,
    p_start_date text DEFAULT NULL,
    p_end_date text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    start_date date,
    due_date date,
    status text,
    priority text,
    progress_percentage integer,
    owner_name text,
    team_name text,
    total_tasks bigint,
    completed_tasks bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name::text,
        p.description::text,
        p.start_date,
        p.due_date,
        p.status::text,
        p.priority::text,
        p.progress_percentage,
        u.full_name::text as owner_name,
        t.name::text as team_name,
        COALESCE(task_stats.total_tasks, 0) as total_tasks,
        COALESCE(task_stats.completed_tasks, 0) as completed_tasks
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN (
        SELECT 
            project_id,
            COUNT(*) as total_tasks,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks
        FROM tasks 
        WHERE deleted_at IS NULL
        GROUP BY project_id
    ) task_stats ON p.id = task_stats.project_id
    WHERE p.deleted_at IS NULL
      AND p.is_active = true
      AND p.status = 'active'
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_gantt_projects(text[], text[], text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION get_gantt_projects(text[], text[], text, text, text) TO authenticated;