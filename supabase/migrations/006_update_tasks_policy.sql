-- Atualizar política RLS da tabela tasks para permitir que qualquer usuário autenticado possa atualizar tarefas

-- Remover a política existente
DROP POLICY IF EXISTS "Users can update their tasks or if have permission" ON public.tasks;

-- Criar nova política mais permissiva
CREATE POLICY "Users can update their tasks or if have permission" ON public.tasks
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);