-- Remove the generates_impediment column from project_deviations table
ALTER TABLE project_deviations DROP COLUMN IF EXISTS generates_impediment;

-- Remove any indexes that might reference the generates_impediment column
DROP INDEX IF EXISTS idx_project_deviations_generates_impediment;

-- Update any existing triggers or functions that might reference generates_impediment
-- Note: This migration assumes that any triggers referencing generates_impediment
-- have been updated or are no longer needed