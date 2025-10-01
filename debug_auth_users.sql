-- Verificar constraints e políticas da tabela auth.users
-- que podem estar causando o erro "Database error creating new user"

-- 1. Verificar constraints da tabela auth.users
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'auth.users'::regclass;

-- 2. Verificar políticas RLS na tabela auth.users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';

-- 3. Verificar triggers na tabela auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- 4. Verificar índices únicos que podem causar conflitos
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'auth' 
AND tablename = 'users'
AND indexdef LIKE '%UNIQUE%';

-- 5. Verificar se há usuários existentes com emails duplicados
SELECT 
    email,
    COUNT(*) as count
FROM auth.users 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;

-- 6. Verificar configurações de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'auth' 
AND tablename = 'users';