-- =====================================================
-- MIGRAÇÃO: Corrigir política de DELETE para comentários
-- =====================================================
-- Permite que admins da equipe deletem comentários de projetos da equipe
-- além do autor do comentário

-- Remover política atual de DELETE
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Criar nova política de DELETE que permite:
-- 1. Autor do comentário deletar
-- 2. Admins da equipe deletar comentários de projetos da equipe
CREATE POLICY "Users can delete comments with proper permissions" ON comments
  FOR DELETE USING (
    -- Autor do comentário pode deletar
    author_id = auth.uid() 
    OR
    -- Admin da equipe pode deletar comentários de projetos da equipe
    (
      context = 'project' AND
      EXISTS (
        SELECT 1 FROM projects p
        JOIN team_members tm ON p.team_id = tm.team_id
        WHERE p.id = context_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
      )
    )
    OR
    -- Admin da equipe pode deletar comentários de tarefas de projetos da equipe
    (
      context = 'task' AND
      EXISTS (
        SELECT 1 FROM tasks t
        JOIN projects p ON t.project_id = p.id
        JOIN team_members tm ON p.team_id = tm.team_id
        WHERE t.id = context_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
      )
    )
    OR
    -- Admin da equipe pode deletar comentários da própria equipe
    (
      context = 'team' AND
      EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = context_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
      )
    )
  );

-- Comentário sobre a política
COMMENT ON POLICY "Users can delete comments with proper permissions" ON comments IS 
'Permite que usuários deletem comentários se forem o autor ou admin da equipe no contexto apropriado';