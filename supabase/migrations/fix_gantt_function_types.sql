-- Corrigir tipos da função get_gantt_projects
-- Primeiro, remover a função existente
DROP FUNCTION IF EXISTS get_gantt_projects(text[], text[], uuid, timestamp, timestamp);

-- Recriar a função com os tipos corretos
CREATE OR REPLACE FUNCTION get_gantt_projects(
    p_status text[] DEFAULT NULL,
    p_priority text[] DEFAULT NULL,
    p_team_id uuid DEFAULT NULL,
    p_start_date timestamp DEFAULT NULL,
    p_end_date timestamp DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    name text,
    description text,
    status text,
    priority text,
    start_date timestamp,
    due_date timestamp,
    progress_percentage integer,
    owner_name character varying,
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
        pgv.id,
        pgv.name,
        pgv.description,
        pgv.status,
        pgv.priority,
        pgv.start_date,
        pgv.due_date,
        pgv.progress_percentage,
        pgv.owner_name,
        pgv.team_name,
        pgv.total_tasks,
        pgv.completed_tasks
    FROM projects_gantt_view pgv
    WHERE 
        (p_status IS NULL OR pgv.status = ANY(p_status))
        AND (p_priority IS NULL OR pgv.priority = ANY(p_priority))
        AND (p_team_id IS NULL OR pgv.team_id = p_team_id)
        AND (p_start_date IS NULL OR pgv.due_date >= p_start_date)
        AND (p_end_date IS NULL OR pgv.start_date <= p_end_date)
    ORDER BY 
        COALESCE(pgv.start_date, pgv.created_at) ASC,
        pgv.priority DESC;
END;
$$;