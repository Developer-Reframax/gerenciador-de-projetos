-- Remove all existing log triggers and the generic create_project_log function
-- This prepares for the new table-specific logging approach

-- Drop the generic create_project_log function with CASCADE to remove all dependent triggers
DROP FUNCTION IF EXISTS create_project_log() CASCADE;

-- Clear any existing log entries to start fresh with the new approach
-- (Optional - comment out if you want to keep existing logs)
-- TRUNCATE TABLE project_logs;

-- Generic log system removed successfully. Ready for table-specific logging implementation.