-- Corrigir lógica da função para bloquear projeto sempre que desvio for impeditivo
-- independentemente do status de aprovação
CREATE OR REPLACE FUNCTION update_project_status_on_deviation()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o desvio gera impedimento, bloqueia o projeto imediatamente
    IF NEW.generates_impediment = true THEN
        UPDATE projects 
        SET status = 'blocked', 
            updated_at = NOW()
        WHERE id = NEW.project_id;
    END IF;
    
    -- Se o desvio deixou de ser impeditivo ou foi removido/rejeitado
    -- verifica se ainda há outros desvios impeditivos
    IF (OLD.generates_impediment = true AND NEW.generates_impediment = false) 
       OR (OLD.generates_impediment = true AND NEW.status IN ('Rejeitado', 'Implementado')) THEN
        -- Se não há mais desvios impeditivos ativos, volta projeto para "Em andamento"
        IF NOT EXISTS (
            SELECT 1 FROM project_deviations 
            WHERE project_id = NEW.project_id 
            AND generates_impediment = true 
            AND id != NEW.id
            AND status NOT IN ('Rejeitado', 'Implementado')
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

-- Também criar trigger para INSERT (caso não exista)
DROP TRIGGER IF EXISTS trigger_update_project_status_on_deviation ON project_deviations;
CREATE TRIGGER trigger_update_project_status_on_deviation
    AFTER INSERT OR UPDATE ON project_deviations
    FOR EACH ROW
    EXECUTE FUNCTION update_project_status_on_deviation();