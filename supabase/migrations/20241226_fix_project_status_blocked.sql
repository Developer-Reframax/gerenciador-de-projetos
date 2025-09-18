-- Corrigir função para usar status 'blocked' ao invés de 'Paralisado'
CREATE OR REPLACE FUNCTION update_project_status_on_deviation()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o desvio gera impedimento e foi aprovado, bloqueia o projeto
    IF NEW.generates_impediment = true AND NEW.status = 'Aprovado' THEN
        UPDATE projects 
        SET status = 'blocked', 
            updated_at = NOW()
        WHERE id = NEW.project_id;
    END IF;
    
    -- Se não há mais desvios impeditivos ativos, volta projeto para "Em andamento"
    IF OLD.generates_impediment = true AND NEW.status IN ('Rejeitado', 'Implementado') THEN
        IF NOT EXISTS (
            SELECT 1 FROM project_deviations 
            WHERE project_id = NEW.project_id 
            AND generates_impediment = true 
            AND status = 'Aprovado'
        ) THEN
            UPDATE projects 
            SET status = 'Em andamento', 
                updated_at = NOW()
            WHERE id = NEW.project_id AND status = 'blocked';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atualizar projetos que estão com status 'Paralisado' para 'blocked'
UPDATE projects 
SET status = 'blocked' 
WHERE status = 'Paralisado';