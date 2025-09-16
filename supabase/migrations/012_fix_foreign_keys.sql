-- Fix foreign key relationships to point to public.users instead of auth.users
-- and add missing archived column to projects table

-- Drop existing foreign keys that point to auth.users
ALTER TABLE task_status_history DROP CONSTRAINT IF EXISTS task_status_history_changed_by_fkey;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;

-- Add new foreign keys pointing to public.users
ALTER TABLE task_status_history 
ADD CONSTRAINT task_status_history_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE projects 
ADD CONSTRAINT projects_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add archived column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Add comment for the new column
COMMENT ON COLUMN projects.archived IS 'Indica se o projeto foi arquivado';

-- Update existing projects with archived status based on status column
UPDATE projects SET archived = true WHERE status = 'archived';

-- Create index for better performance on archived column
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_status_history TO authenticated;
GRANT SELECT ON projects TO anon;
GRANT SELECT ON task_status_history TO anon;