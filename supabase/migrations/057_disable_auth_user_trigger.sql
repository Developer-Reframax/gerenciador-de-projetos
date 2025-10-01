-- =====================================================
-- MIGRAÇÃO: Desabilitar trigger automática de criação de usuários
-- =====================================================
-- Data: 2024
-- Descrição: Remove a trigger que cria automaticamente usuários na tabela users
--           quando um usuário é criado no auth.users, para permitir controle manual

-- Remover a trigger se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover a função associada se não for usada em outro lugar
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Comentário explicativo
COMMENT ON TABLE public.users IS 'Tabela de usuários - trigger automática removida, inserção manual controlada pela API';