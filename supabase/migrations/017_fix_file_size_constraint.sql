-- Corrigir constraint de file_size para permitir arquivos com tamanho 0
-- Usar uma abordagem mais específica para alterar a constraint

-- Primeiro, verificar e remover todas as constraints relacionadas ao file_size
DO $$
BEGIN
    -- Remover constraint se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%file_size%' 
        AND table_name = 'attachments'
    ) THEN
        ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_file_size_check;
    END IF;
    
    -- Remover constraint com nome padrão do PostgreSQL se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE check_clause LIKE '%file_size > 0%'
        AND constraint_name IN (
            SELECT constraint_name FROM information_schema.table_constraints 
            WHERE table_name = 'attachments'
        )
    ) THEN
        EXECUTE 'ALTER TABLE attachments DROP CONSTRAINT ' || (
            SELECT constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
            WHERE tc.table_name = 'attachments' AND cc.check_clause LIKE '%file_size > 0%'
            LIMIT 1
        );
    END IF;
END $$;

-- Adicionar nova constraint que permite file_size >= 0
ALTER TABLE attachments ADD CONSTRAINT attachments_file_size_check CHECK (file_size >= 0);

-- Comentário para documentar a mudança
COMMENT ON CONSTRAINT attachments_file_size_check ON attachments IS 'Permite arquivos com tamanho >= 0, incluindo arquivos vazios';