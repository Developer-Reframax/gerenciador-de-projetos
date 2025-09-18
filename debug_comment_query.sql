-- Script para testar a consulta de comentários da API
-- Substitua os valores pelos IDs reais do seu teste

-- Definir variáveis (substitua pelos valores reais)
\set project_id '132d1755-e867-4c7e-85b5-5a56fe8a0424'
\set comment_id 'f6e5f5ed-d8ee-41ac-811b-be8c2bc70fff'

-- 1. Verificar se o comentário existe na tabela
SELECT 
  id,
  context,
  context_id,
  author_id,
  content,
  created_at
FROM comments 
WHERE id = :'comment_id';

-- 2. Testar a consulta exata da API (sem JOIN com projects)
SELECT 
  c.id,
  c.author_id,
  c.content,
  c.context_id
FROM comments c
WHERE c.id = :'comment_id'
  AND c.context = 'project'
  AND c.context_id = :'project_id';

-- 3. Verificar se o projeto existe
SELECT 
  p.id,
  p.name,
  p.team_id,
  p.owner_id
FROM projects p
WHERE p.id = :'project_id';

-- 4. Verificar membros da equipe do projeto
SELECT 
  tm.user_id,
  tm.role,
  p.id as project_id,
  p.name as project_name
FROM projects p
JOIN team_members tm ON p.team_id = tm.team_id
WHERE p.id = :'project_id';

-- 5. Testar a consulta completa da API com JOIN
SELECT 
  c.id,
  c.author_id,
  c.content,
  c.context_id,
  p.id as project_id,
  p.team_id,
  tm.user_id as member_user_id,
  tm.role as member_role
FROM comments c
JOIN projects p ON c.context_id = p.id
LEFT JOIN team_members tm ON p.team_id = tm.team_id
WHERE c.id = :'comment_id'
  AND c.context = 'project'
  AND c.context_id = :'project_id';

-- 6. Verificar políticas RLS (executar como usuário autenticado)
-- Esta consulta mostra se as políticas estão bloqueando o acesso
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'comments'
ORDER BY policyname;