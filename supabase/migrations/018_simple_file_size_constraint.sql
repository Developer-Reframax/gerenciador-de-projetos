-- Corrigir constraint de file_size de forma simples
-- Remover constraint existente e adicionar nova

-- Encontrar e remover a constraint existente
DO $$
DECLARE
    constraint_name_var text;
BEGIN
    -- Buscar o nome da constraint que contém a verificação file_size > 0
    SELECT tc.constraint_name INTO constraint_name_var
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_name = 'attachments' 
    AND tc.table_schema = 'public'
    AND cc.check_clause LIKE '%file_size%'
    LIMIT 1;
    
    -- Se encontrou a constraint, remove ela
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE attachments DROP CONSTRAINT ' || quote_ident(constraint_name_var);
    END IF;
END $$;

-- Adicionar nova constraint que permite file_size >= 0
ALTER TABLE attachments ADD CONSTRAINT attachments_file_size_check CHECK (file_size >= 0);