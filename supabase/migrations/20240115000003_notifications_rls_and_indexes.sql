-- Adicionar políticas RLS e índices para a tabela notifications

-- Habilitar RLS na tabela notifications (se ainda não estiver habilitado)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias notificações
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários atualizem apenas suas próprias notificações
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir inserção de notificações (para sistema/admin)
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Política para permitir que usuários marquem suas notificações como lidas
CREATE POLICY "Users can mark their notifications as read" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices para melhorar performance

-- Índice principal para buscar notificações por usuário
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

-- Índice para buscar notificações não lidas por usuário
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, status_viewer) 
  WHERE status_viewer = false;

-- Índice para buscar notificações pendentes de email
CREATE INDEX IF NOT EXISTS idx_notifications_email_pending 
  ON notifications(status_email, created_at) 
  WHERE status_email = false;

-- Índice para buscar notificações por tipo
CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON notifications(type);

-- Índice para buscar notificações por prioridade
CREATE INDEX IF NOT EXISTS idx_notifications_priority 
  ON notifications(priority);

-- Índice composto para buscar notificações por usuário e data (para paginação)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

-- Índice para buscar notificações por usuário e tipo
CREATE INDEX IF NOT EXISTS idx_notifications_user_type 
  ON notifications(user_id, type);

-- Índice para estatísticas por período
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON notifications(created_at);

-- Conceder permissões para as roles anon e authenticated
GRANT SELECT ON notifications TO anon;
GRANT ALL PRIVILEGES ON notifications TO authenticated;

-- Verificar se as permissões foram aplicadas corretamente
-- (Esta query pode ser executada manualmente para verificar)
/*
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;
*/

-- Comentários para documentação
COMMENT ON TABLE notifications IS 'Tabela de notificações do sistema com RLS habilitado';
COMMENT ON COLUMN notifications.user_id IS 'ID do usuário que receberá a notificação';
COMMENT ON COLUMN notifications.message IS 'Conteúdo da notificação';
COMMENT ON COLUMN notifications.type IS 'Tipo da notificação (info, warning, error, success)';
COMMENT ON COLUMN notifications.priority IS 'Prioridade da notificação (low, medium, high, urgent)';
COMMENT ON COLUMN notifications.status_viewer IS 'Status de visualização (false=não lida, true=lida)';
COMMENT ON COLUMN notifications.status_email IS 'Status do envio por email (false=pendente, true=enviado)';

-- Função para limpar notificações antigas (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Deletar notificações lidas com mais de 30 dias
  DELETE FROM notifications 
  WHERE status_viewer = true 
    AND created_at < NOW() - INTERVAL '30 days';
    
  -- Deletar notificações não lidas com mais de 90 dias
  DELETE FROM notifications 
  WHERE status_viewer = false 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário na função
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Função para limpar notificações antigas automaticamente';