-- Adicionar constraint adicional para file_size >= 0
-- Esta constraint será verificada junto com a existente

-- Como não conseguimos remover a constraint existente facilmente,
-- vamos adicionar uma constraint adicional que permite file_size >= 0
-- O PostgreSQL verificará ambas as constraints

-- Primeiro, vamos tentar remover constraints conhecidas
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_file_size_check;
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_check;

-- Adicionar nova constraint que permite file_size >= 0
ALTER TABLE attachments ADD CONSTRAINT attachments_file_size_valid CHECK (file_size >= 0);

-- Comentário
COMMENT ON CONSTRAINT attachments_file_size_valid ON attachments IS 'Permite arquivos com tamanho >= 0';