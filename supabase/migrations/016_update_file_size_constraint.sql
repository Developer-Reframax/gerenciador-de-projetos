-- Alterar constraint de file_size para permitir arquivos com tamanho 0
-- Remove a constraint atual e adiciona uma nova que permite file_size >= 0

-- Remover a constraint existente
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_file_size_check;

-- Adicionar nova constraint que permite file_size >= 0
ALTER TABLE attachments ADD CONSTRAINT attachments_file_size_check CHECK (file_size >= 0);

-- Comentário para documentar a mudança
COMMENT ON CONSTRAINT attachments_file_size_check ON attachments IS 'Permite arquivos com tamanho >= 0, incluindo arquivos vazios';