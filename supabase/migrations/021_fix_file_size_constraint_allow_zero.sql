-- Fix file_size constraint to allow zero-byte files
-- Drop the existing check constraint and create a new one that allows file_size >= 0

-- First, drop the existing constraint
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_file_size_check;

-- Add new constraint that allows file_size >= 0
ALTER TABLE attachments ADD CONSTRAINT attachments_file_size_check CHECK (file_size >= 0);

-- Update the comment to reflect the change
COMMENT ON COLUMN attachments.file_size IS 'File size in bytes, allows zero-byte files';