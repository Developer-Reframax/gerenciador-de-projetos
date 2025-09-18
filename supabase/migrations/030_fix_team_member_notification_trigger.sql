-- Correção do trigger de notificação para adição de membros à equipe
-- Criar triggers separados para INSERT e UPDATE

-- Primeiro, remover o trigger existente
DROP TRIGGER IF EXISTS trigger_notify_user_added_to_team ON team_members;

-- Trigger para INSERT quando status é 'active'
CREATE TRIGGER trigger_notify_user_added_to_team_insert
    AFTER INSERT ON team_members
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION notify_user_added_to_team();

-- Trigger para UPDATE quando status muda para 'active'
CREATE TRIGGER trigger_notify_user_added_to_team_update
    AFTER UPDATE ON team_members
    FOR EACH ROW
    WHEN (OLD.status != 'active' AND NEW.status = 'active')
    EXECUTE FUNCTION notify_user_added_to_team();