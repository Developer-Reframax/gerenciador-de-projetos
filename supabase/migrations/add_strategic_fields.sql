-- Migration: Add strategic fields to projects table
-- Date: 2024-01-25
-- Description: Add new strategic fields for project management

-- Add new strategic fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS direct_responsibles TEXT,
ADD COLUMN IF NOT EXISTS requesting_area TEXT[],
ADD COLUMN IF NOT EXISTS planned_budget DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS used_budget DECIMAL(15,2);

-- Update strategic_objective_id to allow text values (if needed)
-- First, let's check if we need to modify the strategic_objective field
-- Since the requirement is to make it free text, we'll add a new column for text objective
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS strategic_objective_text TEXT;

-- Add comments for documentation
COMMENT ON COLUMN projects.owner_name IS 'Project owner name (required field)';
COMMENT ON COLUMN projects.direct_responsibles IS 'Direct project responsibles (required field)';
COMMENT ON COLUMN projects.requesting_area IS 'Requesting area list (non-restrictive, required field)';
COMMENT ON COLUMN projects.planned_budget IS 'Planned budget for the project (required field)';
COMMENT ON COLUMN projects.used_budget IS 'Used budget for the project (optional field)';
COMMENT ON COLUMN projects.strategic_objective_text IS 'Strategic objective as free text (required field)';

-- Grant permissions to authenticated users
GRANT SELECT, UPDATE ON projects TO authenticated;
GRANT SELECT ON projects TO anon;