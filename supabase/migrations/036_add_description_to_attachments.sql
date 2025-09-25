-- Add description column to attachments table
ALTER TABLE attachments ADD COLUMN description TEXT;

-- Add comment to the column
COMMENT ON COLUMN attachments.description IS 'Description of the attachment file';

-- Update RLS policies to include description field (if needed)
-- The existing policies should automatically cover the new column