-- Adicionar coluna priority à tabela workflows
ALTER TABLE workflows 
ADD COLUMN priority VARCHAR(10) DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica'));

-- Comentário explicativo
COMMENT ON COLUMN workflows.priority IS 'Prioridade do workflow: baixa, media, alta, critica';