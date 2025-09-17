-- Force fix for file_size constraint to allow zero-byte files
-- This migration ensures the constraint is properly updated

-- Drop all existing check constraints on file_size column
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop all check constraints on the file_size column
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'attachments'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%file_size%'
    LOOP
        EXECUTE 'ALTER TABLE attachments DROP CONSTRAINT ' || quote_ident(constraint_name);
    END LOOP;
END $$;

-- Add the new constraint that allows file_size >= 0
ALTER TABLE attachments ADD CONSTRAINT attachments_file_size_check CHECK (file_size >= 0);

-- Update the comment
COMMENT ON COLUMN attachments.file_size IS 'File size in bytes, allows zero-byte files';