-- Migração para atualizar valores do enum project_priority
-- De: 'low', 'medium', 'high', 'urgent'
-- Para: 'tactical', 'important', 'priority'

-- Primeiro removemos o constraint existente para permitir a atualização
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_priority_check;

-- Agora vamos mapear os dados existentes
UPDATE projects 
SET priority = CASE 
    WHEN priority = 'low' THEN 'tactical'
    WHEN priority = 'medium' THEN 'important'
    WHEN priority = 'high' THEN 'priority'
    WHEN priority = 'urgent' THEN 'priority'  -- urgent vira priority
    ELSE priority
END;

-- Criamos o novo constraint com os novos valores
ALTER TABLE projects ADD CONSTRAINT projects_priority_check 
    CHECK (priority IN ('tactical', 'important', 'priority'));

-- Verificar se a migração foi aplicada corretamente
SELECT DISTINCT priority FROM projects ORDER BY priority;