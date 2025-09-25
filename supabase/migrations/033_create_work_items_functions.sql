-- Migração para criar funções e triggers dos Itens de Trabalho
-- Data: 2024-01-27
-- Descrição: Função get_stage_work_items() e triggers de auditoria

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at para risks
CREATE TRIGGER update_risks_updated_at
    BEFORE UPDATE ON risks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger de updated_at para impediments
CREATE TRIGGER update_impediments_updated_at
    BEFORE UPDATE ON impediments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para buscar todos os itens de trabalho de uma etapa
CREATE OR REPLACE FUNCTION get_stage_work_items(stage_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'tasks', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', t.id,
                'title', t.title,
                'description', t.description,
                'status', t.status,
                'priority', t.priority,
                'assigned_to', CASE 
                    WHEN u.id IS NOT NULL THEN json_build_object(
                        'id', u.id,
                        'name', u.name,
                        'email', u.email
                    )
                    ELSE NULL
                END,
                'due_date', t.due_date,
                'created_at', t.created_at,
                'updated_at', t.updated_at
            ) ORDER BY t.created_at), '[]'::json)
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.stage_id = stage_uuid
        ),
        'risks', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', r.id,
                'name', r.name,
                'description', r.description,
                'status', r.status,
                'impact', r.impact,
                'probability', r.probability,
                'responsible', CASE 
                    WHEN u.id IS NOT NULL THEN json_build_object(
                        'id', u.id,
                        'name', u.name,
                        'email', u.email
                    )
                    ELSE NULL
                END,
                'identification_date', r.identification_date,
                'expected_resolution_date', r.expected_resolution_date,
                'created_at', r.created_at,
                'updated_at', r.updated_at
            ) ORDER BY r.identification_date DESC), '[]'::json)
            FROM risks r
            LEFT JOIN users u ON r.responsible_id = u.id
            WHERE r.stage_id = stage_uuid
        ),
        'impediments', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', i.id,
                'description', i.description,
                'identification_date', i.identification_date,
                'responsible', CASE 
                    WHEN u.id IS NOT NULL THEN json_build_object(
                        'id', u.id,
                        'name', u.name,
                        'email', u.email
                    )
                    ELSE NULL
                END,
                'expected_resolution_date', i.expected_resolution_date,
                'criticality', i.criticality,
                'status', i.status,
                'created_at', i.created_at,
                'updated_at', i.updated_at
            ) ORDER BY i.identification_date DESC), '[]'::json)
            FROM impediments i
            LEFT JOIN users u ON i.responsible_id = u.id
            WHERE i.stage_id = stage_uuid
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar todos os riscos de um projeto
CREATE OR REPLACE FUNCTION get_project_risks(project_uuid UUID)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT COALESCE(json_agg(json_build_object(
            'id', r.id,
            'name', r.name,
            'description', r.description,
            'status', r.status,
            'impact', r.impact,
            'probability', r.probability,
            'responsible', CASE 
                WHEN u.id IS NOT NULL THEN json_build_object(
                    'id', u.id,
                    'name', u.name,
                    'email', u.email
                )
                ELSE NULL
            END,
            'stage', json_build_object(
                'id', s.id,
                'name', s.name
            ),
            'identification_date', r.identification_date,
            'expected_resolution_date', r.expected_resolution_date,
            'created_at', r.created_at,
            'updated_at', r.updated_at
        ) ORDER BY r.identification_date DESC), '[]'::json)
        FROM risks r
        LEFT JOIN users u ON r.responsible_id = u.id
        JOIN stages s ON r.stage_id = s.id
        WHERE s.project_id = project_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar todos os impedimentos de um projeto
CREATE OR REPLACE FUNCTION get_project_impediments(project_uuid UUID)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT COALESCE(json_agg(json_build_object(
            'id', i.id,
            'description', i.description,
            'identification_date', i.identification_date,
            'responsible', CASE 
                WHEN u.id IS NOT NULL THEN json_build_object(
                    'id', u.id,
                    'name', u.name,
                    'email', u.email
                )
                ELSE NULL
            END,
            'stage', json_build_object(
                'id', s.id,
                'name', s.name
            ),
            'expected_resolution_date', i.expected_resolution_date,
            'criticality', i.criticality,
            'status', i.status,
            'created_at', i.created_at,
            'updated_at', i.updated_at
        ) ORDER BY i.identification_date DESC), '[]'::json)
        FROM impediments i
        LEFT JOIN users u ON i.responsible_id = u.id
        JOIN stages s ON i.stage_id = s.id
        WHERE s.project_id = project_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões de execução das funções
GRANT EXECUTE ON FUNCTION get_stage_work_items(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_risks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_impediments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_stage_work_items(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_project_risks(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_project_impediments(UUID) TO anon;