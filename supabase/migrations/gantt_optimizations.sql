-- Otimizações de banco de dados para funcionalidade de Gráfico de Gantt
-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_gantt_dates 
ON projects(start_date, due_date) 
WHERE start_date IS NOT NULL AND due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_gantt_status 
ON projects(status, priority);

CREATE INDEX IF NOT EXISTS idx_projects_gantt_team 
ON projects(team_id) 
WHERE team_id IS NOT NULL;

-- View otimizada para dados do Gantt
CREATE OR REPLACE VIEW projects_gantt_view AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.status,
    p.priority,
    p.start_date,
    p.due_date,
    p.progress_percentage,
    p.budget,
    p.created_at,
    p.updated_at,
    u.id as owner_id,
    u.full_name as owner_name,
    u.email as owner_email,
    t.id as team_id,
    t.name as team_name,
    COUNT(tasks.id) as total_tasks,
    COUNT(CASE WHEN tasks.status = 'completed' THEN 1 END) as completed_tasks
FROM projects p
LEFT JOIN users u ON p.owner_id = u.id
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN tasks ON p.id = tasks.project_id
WHERE p.deleted_at IS NULL
  AND (p.start_date IS NOT NULL OR p.due_date IS NOT NULL)
GROUP BY p.id, u.id, u.full_name, u.email, t.id, t.name;

-- Nota: As políticas RLS são aplicadas nas tabelas base (projects, users, teams)
-- A view herda automaticamente as permissões das tabelas subjacentes

-- Função para buscar projetos do Gantt com filtros
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