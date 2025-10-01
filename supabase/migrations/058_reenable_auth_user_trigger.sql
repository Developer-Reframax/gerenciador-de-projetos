-- =====================================================
-- MIGRAÇÃO: Reabilitar trigger automática de criação de usuários
-- =====================================================
-- Data: 2024
-- Descrição: Recria a trigger que cria automaticamente usuários na tabela users
--           quando um usuário é criado no auth.users

-- Recriar a função para lidar com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir o novo usuário na tabela public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    true,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro (opcional)
    RAISE LOG 'Erro ao criar usuário na tabela users: %', SQLERRM;
    -- Não falhar a criação do usuário no auth mesmo se houver erro
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar a trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentário explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 'Função que cria automaticamente um registro na tabela users quando um usuário é criado no auth.users';
COMMENT ON TABLE public.users IS 'Tabela de usuários - trigger automática reabilitada para sincronização com auth.users';