-- Inserir um segundo projeto para teste
INSERT INTO projects (
  name,
  description,
  status,
  priority,
  owner_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Projeto de Teste 2',
  'Segundo projeto para testar o Kanban',
  'active',
  'medium',
  (SELECT id FROM auth.users LIMIT 1),
  true,
  NOW(),
  NOW()
);

-- Verificar se foi criado
SELECT id, name, status, is_active, deleted_at FROM projects WHERE status = 'active' ORDER BY name;