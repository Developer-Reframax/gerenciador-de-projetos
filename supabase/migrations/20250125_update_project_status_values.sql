-- Migração para atualizar os valores de status dos projetos
-- Etapa 1: Remover constraint existente
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Etapa 2: Atualizar os valores existentes
UPDATE projects 
SET status = CASE 
    WHEN status = 'planning' THEN 'not_started'
    WHEN status = 'active' THEN 'in_progress'
    WHEN status = 'on_hold' THEN 'paused'
    WHEN status = 'blocked' THEN 'paused'
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'cancelled' THEN 'cancelled'
    WHEN status = 'archived' THEN 'completed'
    ELSE 'not_started'
END;

-- Etapa 3: Adicionar nova constraint
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN ('not_started', 'in_progress', 'paused', 'completed', 'cancelled'));

-- Etapa 4: Atualizar valor padrão
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'not_started';

-- Comentário
COMMENT ON COLUMN projects.status IS 'Status: not_started, in_progress, paused, completed, cancelled';