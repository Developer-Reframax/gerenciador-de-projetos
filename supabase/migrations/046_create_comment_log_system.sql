-- Migração para criar sistema de logs específico para comentários
-- Inclui INSERT, UPDATE e DELETE

-- Criar função para logs de comentários
CREATE OR REPLACE FUNCTION log_comment_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_project_id UUID;
    v_user_id UUID;
    v_description TEXT;
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
BEGIN
    -- Determinar project_id e user_id baseado na operação
    IF TG_OP = 'DELETE' THEN
        v_project_id := OLD.project_id;
        v_user_id := OLD.author_id;
        v_old_data := to_jsonb(OLD);
        
        -- Descrição para DELETE
        v_description := 'Comentário excluído: "' || 
            CASE 
                WHEN length(OLD.content) > 50 THEN 
                    substring(OLD.content from 1 for 50) || '...'
                ELSE OLD.content
            END || '"';
            
    ELSIF TG_OP = 'INSERT' THEN
        v_project_id := NEW.project_id;
        v_user_id := NEW.author_id;
        v_new_data := to_jsonb(NEW);
        
        -- Descrição para INSERT
        v_description := 'Novo comentário adicionado: "' || 
            CASE 
                WHEN length(NEW.content) > 50 THEN 
                    substring(NEW.content from 1 for 50) || '...'
                ELSE NEW.content
            END || '"';
            
    ELSIF TG_OP = 'UPDATE' THEN
        v_project_id := NEW.project_id;
        v_user_id := NEW.author_id;
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        
        -- Descrição para UPDATE
        v_description := 'Comentário editado';
        
        -- Adicionar detalhes específicos do que foi alterado
        IF OLD.content != NEW.content THEN
            v_description := v_description || ' - conteúdo alterado';
        END IF;
        
        IF OLD.is_pinned != NEW.is_pinned THEN
            v_description := v_description || 
                CASE WHEN NEW.is_pinned THEN ' - fixado' ELSE ' - desfixado' END;
        END IF;
        
        IF OLD.is_internal != NEW.is_internal THEN
            v_description := v_description || 
                CASE WHEN NEW.is_internal THEN ' - marcado como interno' ELSE ' - marcado como público' END;
        END IF;
    END IF;
    
    -- Inserir log apenas se temos project_id válido
    IF v_project_id IS NOT NULL THEN
        INSERT INTO project_logs (
            project_id,
            table_name,
            record_id,
            action_type,
            user_id,
            old_data,
            new_data,
            description
        ) VALUES (
            v_project_id,
            'comments',
            COALESCE(NEW.id, OLD.id),
            TG_OP,
            v_user_id,
            v_old_data,
            v_new_data,
            v_description
        );
    END IF;
    
    -- Retornar o registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers para a tabela comments
DROP TRIGGER IF EXISTS trigger_log_comment_insert ON comments;
DROP TRIGGER IF EXISTS trigger_log_comment_update ON comments;
DROP TRIGGER IF EXISTS trigger_log_comment_delete ON comments;

-- Trigger para INSERT
CREATE TRIGGER trigger_log_comment_insert
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION log_comment_changes();

-- Trigger para UPDATE
CREATE TRIGGER trigger_log_comment_update
    AFTER UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION log_comment_changes();

-- Trigger para DELETE
CREATE TRIGGER trigger_log_comment_delete
    BEFORE DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION log_comment_changes();

-- Comentário da migração
COMMENT ON FUNCTION log_comment_changes() IS 'Função para registrar logs de mudanças na tabela comments (INSERT, UPDATE, DELETE)';