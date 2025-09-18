-- Verificar e corrigir políticas RLS para a tabela users
-- Permitir que usuários autenticados possam ativar/desativar outros usuários

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Users can update user status" ON users;

-- Política para visualizar usuários (todos os usuários autenticados podem ver outros usuários)
CREATE POLICY "Users can view all users" ON users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política para usuários atualizarem seus próprios perfis
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para admins atualizarem qualquer usuário
CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política específica para permitir que qualquer usuário autenticado possa alterar is_active
CREATE POLICY "Users can update user status" ON users
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Garantir que as permissões básicas estejam configuradas
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';