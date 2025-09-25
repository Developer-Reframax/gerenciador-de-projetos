-- Test script to verify if the attachments trigger is working
-- This will insert a test attachment using an existing project and check if a log is created

DO $$
DECLARE
    existing_project_id uuid;
    test_attachment_id uuid := '44444444-4444-4444-4444-444444444444'::uuid;
BEGIN

-- Get an existing project ID
SELECT id INTO existing_project_id FROM projects LIMIT 1;

IF existing_project_id IS NULL THEN
    RAISE NOTICE 'ERROR: No existing projects found. Cannot test attachment trigger.';
    RETURN;
END IF;

RAISE NOTICE 'Using existing project ID: %', existing_project_id;

-- Insert a test attachment
INSERT INTO attachments (
    id,
    project_id,
    filename,
    original_filename,
    file_path,
    file_size,
    mime_type,
    file_type,
    uploaded_by
) VALUES (
    test_attachment_id,
    existing_project_id,
    'test-file.pdf',
    'Original Test File.pdf',
    '/uploads/test-file.pdf',
    1024,
    'application/pdf',
    'document',
    '00000000-0000-0000-0000-000000000000'::uuid
);

RAISE NOTICE 'Test attachment inserted with ID: %', test_attachment_id;

-- Wait a moment for trigger to execute
PERFORM pg_sleep(0.1);

-- Check if the log was created
RAISE NOTICE 'Checking project_logs table for attachment log...';

IF EXISTS (
    SELECT 1 FROM project_logs 
    WHERE table_name = 'attachments' 
    AND record_id = test_attachment_id
    AND action_type = 'INSERT'
) THEN
    RAISE NOTICE 'SUCCESS: Log entry found for attachment creation!';
    
    -- Show the log details
    RAISE NOTICE 'Log details: %', (
        SELECT row_to_json(pl.*) 
        FROM project_logs pl 
        WHERE table_name = 'attachments' 
        AND record_id = test_attachment_id
        AND action_type = 'INSERT'
    );
ELSE
    RAISE NOTICE 'ERROR: No log entry found for attachment creation!';
    
    -- Show what logs exist for debugging
    RAISE NOTICE 'Existing logs count: %', (SELECT COUNT(*) FROM project_logs);
    RAISE NOTICE 'Recent logs: %', (
        SELECT array_agg(row_to_json(pl.*)) 
        FROM (SELECT * FROM project_logs ORDER BY created_at DESC LIMIT 3) pl
    );
END IF;

-- Clean up test data
DELETE FROM attachments WHERE id = test_attachment_id;
DELETE FROM project_logs WHERE record_id = test_attachment_id;

RAISE NOTICE 'Test completed and cleanup done.';

END $$;