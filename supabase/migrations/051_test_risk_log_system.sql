-- Test risk log system
-- This script tests the risk logging functionality

-- Test INSERT operation
DO $$
DECLARE
    test_stage_id UUID;
    test_user_id UUID;
    test_risk_id UUID;
    log_count INTEGER;
BEGIN
    -- Get an existing stage_id and user_id for testing
    SELECT s.id INTO test_stage_id FROM stages s LIMIT 1;
    SELECT u.id INTO test_user_id FROM users u LIMIT 1;
    
    IF test_stage_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Insert a test risk
        INSERT INTO risks (
            stage_id,
            name,
            description,
            status,
            impact,
            probability,
            responsible_id,
            identification_date
        ) VALUES (
            test_stage_id,
            'Test Risk - Sistema de Logs',
            'Risco de teste para verificar o sistema de logs',
            'identificado',
            'prazo',
            'media',
            test_user_id,
            CURRENT_DATE
        ) RETURNING id INTO test_risk_id;
        
        -- Check if log was created
        SELECT COUNT(*) INTO log_count
        FROM project_logs
        WHERE table_name = 'risks'
          AND record_id = test_risk_id
          AND action_type = 'INSERT';
        
        IF log_count > 0 THEN
            RAISE NOTICE 'SUCCESS: Risk INSERT log created successfully';
        ELSE
            RAISE NOTICE 'ERROR: Risk INSERT log was not created';
        END IF;
        
        -- Test UPDATE operation
        UPDATE risks
        SET status = 'em_analise',
            probability = 'alta'
        WHERE id = test_risk_id;
        
        -- Check if update log was created
        SELECT COUNT(*) INTO log_count
        FROM project_logs
        WHERE table_name = 'risks'
          AND record_id = test_risk_id
          AND action_type = 'UPDATE';
        
        IF log_count > 0 THEN
            RAISE NOTICE 'SUCCESS: Risk UPDATE log created successfully';
        ELSE
            RAISE NOTICE 'ERROR: Risk UPDATE log was not created';
        END IF;
        
        -- Test DELETE operation
        DELETE FROM risks WHERE id = test_risk_id;
        
        -- Check if delete log was created
        SELECT COUNT(*) INTO log_count
        FROM project_logs
        WHERE table_name = 'risks'
          AND record_id = test_risk_id
          AND action_type = 'DELETE';
        
        IF log_count > 0 THEN
            RAISE NOTICE 'SUCCESS: Risk DELETE log created successfully';
        ELSE
            RAISE NOTICE 'ERROR: Risk DELETE log was not created';
        END IF;
        
        -- Clean up test logs
        DELETE FROM project_logs
        WHERE table_name = 'risks'
          AND record_id = test_risk_id;
        
        RAISE NOTICE 'Test completed and cleaned up';
    ELSE
        RAISE NOTICE 'ERROR: No test data available (missing stage or user)';
    END IF;
END $$;

-- Show recent risk logs
SELECT 
    pl.created_at,
    pl.action_type,
    pl.table_name,
    pl.new_data->>'name' as risk_name,
    pl.new_data->>'status' as risk_status,
    pl.description,
    u.name as user_name
FROM project_logs pl
LEFT JOIN users u ON pl.user_id = u.id
WHERE pl.table_name = 'risks'
ORDER BY pl.created_at DESC
LIMIT 10;