-- Test the attachment logging system
-- This script will test INSERT and DELETE operations to verify the logging function works

DO $$
DECLARE
    test_project_id uuid;
    test_user_id uuid;
    test_attachment_id uuid;
    log_count_before int;
    log_count_after int;
BEGIN
    -- Get an existing project_id and user_id from the database
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    -- If no project or user exists, create test data
    IF test_project_id IS NULL THEN
        RAISE NOTICE 'No existing project found. Please ensure there is at least one project in the database to test.';
        RETURN;
    END IF;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No existing user found. Please ensure there is at least one user in the database to test.';
        RETURN;
    END IF;
    
    -- Count existing logs
    SELECT COUNT(*) INTO log_count_before FROM project_logs WHERE table_name = 'attachments';
    
    RAISE NOTICE 'Starting attachment log test with project_id: % and user_id: %', test_project_id, test_user_id;
    RAISE NOTICE 'Initial log count for attachments: %', log_count_before;
    
    -- Test INSERT operation
    INSERT INTO attachments (
        project_id,
        filename,
        original_filename,
        file_path,
        file_size,
        mime_type,
        file_type,
        uploaded_by,
        description
    ) VALUES (
        test_project_id,
        'test_file_' || extract(epoch from now()) || '.txt',
        'test_original_file.txt',
        '/uploads/test_file.txt',
        1024,
        'text/plain',
        'document',
        test_user_id,
        'Test attachment for logging system'
    ) RETURNING id INTO test_attachment_id;
    
    RAISE NOTICE 'Inserted test attachment with id: %', test_attachment_id;
    
    -- Check if INSERT log was created
    SELECT COUNT(*) INTO log_count_after FROM project_logs 
    WHERE table_name = 'attachments' AND action_type = 'INSERT' AND record_id = test_attachment_id;
    
    IF log_count_after > 0 THEN
        RAISE NOTICE 'SUCCESS: INSERT log was created for attachment';
    ELSE
        RAISE NOTICE 'ERROR: INSERT log was NOT created for attachment';
    END IF;
    
    -- Test DELETE operation
    DELETE FROM attachments WHERE id = test_attachment_id;
    
    RAISE NOTICE 'Deleted test attachment with id: %', test_attachment_id;
    
    -- Check if DELETE log was created
    SELECT COUNT(*) INTO log_count_after FROM project_logs 
    WHERE table_name = 'attachments' AND action_type = 'DELETE' AND record_id = test_attachment_id;
    
    IF log_count_after > 0 THEN
        RAISE NOTICE 'SUCCESS: DELETE log was created for attachment';
    ELSE
        RAISE NOTICE 'ERROR: DELETE log was NOT created for attachment';
    END IF;
    
    -- Final log count
    SELECT COUNT(*) INTO log_count_after FROM project_logs WHERE table_name = 'attachments';
    RAISE NOTICE 'Final log count for attachments: %', log_count_after;
    RAISE NOTICE 'Expected increase in logs: 2 (1 INSERT + 1 DELETE)';
    
    IF log_count_after = log_count_before + 2 THEN
        RAISE NOTICE 'SUCCESS: Attachment logging system is working correctly!';
    ELSE
        RAISE NOTICE 'WARNING: Expected % logs but found %', log_count_before + 2, log_count_after;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR during test: %', SQLERRM;
END $$;