-- Forçar alteração da constraint de file_size
-- Usar abordagem mais direta

-- Primeiro, vamos alterar a coluna para remover qualquer constraint
ALTER TABLE attachments ALTER COLUMN file_size DROP NOT NULL;
ALTER TABLE attachments ALTER COLUMN file_size SET NOT NULL;

-- Remover todas as constraints relacionadas ao file_size
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'attachments' 
        AND constraint_type = 'CHECK'
        AND constraint_name IN (
            SELECT tc.constraint_name 
            FROM information_schema.table_constraints tc
            JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
            WHERE tc.table_name = 'attachments' AND cc.check_clause LIKE '%file_size%'
        )
    ) LOOP
        EXECUTE 'ALTER TABLE attachments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Adicionar nova constraint
ALTER TABLE attachments ADD CONSTRAINT attachments_file_size_check CHECK (file_size >= 0);