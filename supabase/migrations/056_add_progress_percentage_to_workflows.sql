-- Adicionar coluna progress_percentage à tabela workflows
ALTER TABLE workflows 
ADD COLUMN progress_percentage DECIMAL(5,2) DEFAULT 0.00 NOT NULL;

-- Adicionar constraint para garantir que o valor esteja entre 0 e 100
ALTER TABLE workflows 
ADD CONSTRAINT check_progress_percentage 
CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Comentário explicativo
COMMENT ON COLUMN workflows.progress_percentage IS 'Percentual de progresso do workflow (0-100)';