-- Inserir dados de teste para o sistema de notificações

-- Inserir usuário de teste (se não existir)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'teste@exemplo.com',
  '$2a$10$abcdefghijklmnopqrstuvwxyz',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Usuário Teste"}',
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir perfil do usuário
INSERT INTO public.users (id, email, full_name, is_active, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'teste@exemplo.com',
  'Usuário Teste',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Inserir notificações de teste
INSERT INTO public.notifications (user_id, message, type, priority, status_viewer, status_email, created_at)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Bem-vindo ao sistema de gerenciamento de projetos!',
    'info',
    'normal',
    false,
    false,
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Você foi adicionado a um novo projeto.',
    'success',
    'high',
    false,
    false,
    NOW() - INTERVAL '1 hour'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Lembrete: Reunião de projeto às 14:00.',
    'warning',
    'high',
    false,
    false,
    NOW() - INTERVAL '30 minutes'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Tarefa atribuída: Revisar documentação.',
    'info',
    'normal',
    true,
    false,
    NOW() - INTERVAL '2 hours'
  );

-- Comentário informativo
-- Este arquivo insere dados de teste para demonstrar o funcionamento do sistema de notificações
-- Inclui 1 usuário e 4 notificações (3 não lidas, 1 lida)