-- Corrigir ambiguidade da coluna 'status' na função get_gantt_projects
-- O erro 42702 ocorre porque 'status' pode se referir tanto ao parâmetro p_status quanto à coluna tasks.status

-- Drop existing function
DROP FUNCTION IF EXISTS get_gantt_projects(text[], text[], uuid, timestamp without time zone, timestamp without time zone);

-- Create corrected function with proper column qualification
CREATE OR REPLACE FUNCTION get_gantt_projects(
    p_status text[] DEFAULT NULL,
    p_priority text[] DEFAULT NULL,
    p_team_id uuid DEFAULT NULL,
    p_start_date timestamp without time zone DEFAULT NULL,
    p_end_date timestamp without time zone DEFAULT NULL
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
SECURITY DEFINER
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
            ts.project_id,
            COUNT(*) as total_tasks,
            COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_tasks
        FROM tasks ts
        WHERE ts.deleted_at IS NULL
        GROUP BY ts.project_id
    ) task_stats ON p.id = task_stats.project_id
    WHERE p.deleted_at IS NULL
      AND p.is_active = true
      AND (p_status IS NULL OR p.status = ANY(p_status))
      AND (p_priority IS NULL OR p.priority = ANY(p_priority))
      AND (p_team_id IS NULL OR p.team_id = p_team_id)
      AND (p_start_date IS NULL OR p.start_date >= p_start_date::date)
      AND (p_end_date IS NULL OR p.due_date <= p_end_date::date)
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_gantt_projects(text[], text[], uuid, timestamp without time zone, timestamp without time zone) TO anon;
GRANT EXECUTE ON FUNCTION get_gantt_projects(text[], text[], uuid, timestamp without time zone, timestamp without time zone) TO authenticated;