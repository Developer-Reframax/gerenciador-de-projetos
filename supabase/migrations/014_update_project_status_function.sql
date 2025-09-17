-- Atualizar função RPC para usar os status corretos de projeto
CREATE OR REPLACE FUNCTION get_kanban_project_status_data(
    p_team_id UUID DEFAULT NULL,
    p_priority_filter TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'status_columns', (
            SELECT json_agg(
                json_build_object(
                    'id', status,
                    'title', CASE 
                        WHEN status = 'planning' THEN 'Planejamento'
                        WHEN status = 'active' THEN 'Em Andamento'
                        WHEN status = 'on_hold' THEN 'Em Espera'
                        WHEN status = 'completed' THEN 'Finalizado'
                        WHEN status = 'cancelled' THEN 'Cancelado'
                        ELSE status
                    END,
                    'projects', COALESCE(projects_array, '[]'::json)
                )
            )
            FROM (
                SELECT unnest(ARRAY['planning', 'active', 'on_hold', 'completed', 'cancelled']) as status
            ) statuses
            LEFT JOIN (
                SELECT 
                    p.status,
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'name', p.name,
                            'description', p.description,
                            'priority', p.priority,
                            'team_name', t.name,
                            'start_date', p.start_date,
                            'end_date', p.end_date,
                            'progress', COALESCE(stats.progress, 0),
                            'total_tasks', COALESCE(stats.total_tasks, 0),
                            'completed_tasks', COALESCE(stats.completed_tasks, 0)
                        )
                    ) as projects_array
                FROM projects p
                JOIN teams t ON p.team_id = t.id
                LEFT JOIN (
                    SELECT 
                        project_id,
                        COUNT(*) as total_tasks,
                        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
                        CASE 
                            WHEN COUNT(*) > 0 THEN 
                                ROUND((COUNT(*) FILTER (WHERE status = 'completed')::FLOAT / COUNT(*)) * 100)
                            ELSE 0
                        END as progress
                    FROM tasks
                    GROUP BY project_id
                ) stats ON p.id = stats.project_id
                WHERE (p_team_id IS NULL OR p.team_id = p_team_id)
                    AND (p_priority_filter IS NULL OR p.priority = ANY(p_priority_filter))
                GROUP BY p.status
            ) projects_by_status ON statuses.status = projects_by_status.status
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_kanban_project_status_data TO authenticated;