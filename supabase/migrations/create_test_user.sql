-- Criar usuário de teste
-- Este script cria um usuário de teste para desenvolvimento

-- Inserir usuário na tabela auth.users (Supabase Auth)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'teste@exemplo.com',
    crypt('123456', gen_salt('bf')),
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Usuário Teste"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
) ON CONFLICT (id) DO NOTHING;

-- Inserir identidade na tabela auth.identities
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '{"sub": "00000000-0000-0000-0000-000000000001", "email": "teste@exemplo.com"}',
    'email',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (provider, id) DO NOTHING;

-- O usuário na tabela public.users será criado automaticamente pelo trigger
-- Mas vamos garantir que existe
INSERT INTO public.users (
    id,
    email,
    full_name,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'teste@exemplo.com',
    'Usuário Teste',
    true
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_active = EXCLUDED.is_active;

-- Comentário
COMMENT ON TABLE auth.users IS 'Usuário de teste criado: email=teste@exemplo.com, senha=123456';