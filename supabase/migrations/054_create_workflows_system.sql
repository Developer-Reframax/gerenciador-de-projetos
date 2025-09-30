-- Migration: Create Workflows System
-- Description: Creates all tables for the workflow management system
-- Date: 2024-01-25

-- Create workflows table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('iniciativa', 'melhoria')),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'planejamento' CHECK (status IN ('planejamento', 'em_andamento', 'concluido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_stages table
CREATE TABLE workflow_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_tasks table
CREATE TABLE workflow_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES workflow_stages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'bloqueada')),
    priority VARCHAR(10) DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    position INTEGER NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_attachments table
CREATE TABLE workflow_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER CHECK (file_size <= 10485760), -- 10MB limit
    description TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_comments table
CREATE TABLE workflow_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES workflow_comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_logs table
CREATE TABLE workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_impediments table
CREATE TABLE workflow_impediments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES workflow_tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_resolucao', 'resolvido')),
    severity VARCHAR(10) DEFAULT 'media' CHECK (severity IN ('baixa', 'media', 'alta', 'critica')),
    reported_by UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_date DATE DEFAULT CURRENT_DATE,
    resolved_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_strategic_info table
CREATE TABLE workflow_strategic_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    strategic_data JSONB,
    metrics JSONB,
    kpis JSONB,
    actual_start_date DATE,
    actual_end_date DATE,
    tags JSONB,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for workflows
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflows_category ON workflows(category);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);

-- Create indexes for workflow_stages
CREATE INDEX idx_workflow_stages_workflow_id ON workflow_stages(workflow_id);
CREATE INDEX idx_workflow_stages_created_by ON workflow_stages(created_by);
CREATE INDEX idx_workflow_stages_position ON workflow_stages(workflow_id, position);

-- Create indexes for workflow_tasks
CREATE INDEX idx_workflow_tasks_workflow_id ON workflow_tasks(workflow_id);
CREATE INDEX idx_workflow_tasks_stage_id ON workflow_tasks(stage_id);
CREATE INDEX idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX idx_workflow_tasks_created_by ON workflow_tasks(created_by);

-- Create indexes for workflow_attachments
CREATE INDEX idx_workflow_attachments_workflow_id ON workflow_attachments(workflow_id);
CREATE INDEX idx_workflow_attachments_uploaded_by ON workflow_attachments(uploaded_by);

-- Create indexes for workflow_comments
CREATE INDEX idx_workflow_comments_workflow_id ON workflow_comments(workflow_id);
CREATE INDEX idx_workflow_comments_user_id ON workflow_comments(user_id);
CREATE INDEX idx_workflow_comments_created_at ON workflow_comments(created_at DESC);

-- Create indexes for workflow_logs
CREATE INDEX idx_workflow_logs_workflow_id ON workflow_logs(workflow_id);
CREATE INDEX idx_workflow_logs_user_id ON workflow_logs(user_id);
CREATE INDEX idx_workflow_logs_created_at ON workflow_logs(created_at DESC);
CREATE INDEX idx_workflow_logs_action ON workflow_logs(action);

-- Create indexes for workflow_impediments
CREATE INDEX idx_workflow_impediments_workflow_id ON workflow_impediments(workflow_id);
CREATE INDEX idx_workflow_impediments_task_id ON workflow_impediments(task_id);
CREATE INDEX idx_workflow_impediments_status ON workflow_impediments(status);
CREATE INDEX idx_workflow_impediments_reported_by ON workflow_impediments(reported_by);

-- Create indexes for workflow_strategic_info
CREATE INDEX idx_workflow_strategic_info_workflow_id ON workflow_strategic_info(workflow_id);
CREATE INDEX idx_workflow_strategic_info_created_by ON workflow_strategic_info(created_by);

-- Enable RLS for all tables
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_impediments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_strategic_info ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workflows
CREATE POLICY "Authenticated users can manage workflows" ON workflows
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage workflow_stages" ON workflow_stages
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage workflow_tasks" ON workflow_tasks
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage workflow_attachments" ON workflow_attachments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage workflow_comments" ON workflow_comments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage workflow_logs" ON workflow_logs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage workflow_impediments" ON workflow_impediments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage workflow_strategic_info" ON workflow_strategic_info
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON workflows TO anon;
GRANT ALL PRIVILEGES ON workflows TO authenticated;
GRANT ALL PRIVILEGES ON workflow_stages TO authenticated;
GRANT ALL PRIVILEGES ON workflow_tasks TO authenticated;
GRANT ALL PRIVILEGES ON workflow_attachments TO authenticated;
GRANT ALL PRIVILEGES ON workflow_comments TO authenticated;
GRANT ALL PRIVILEGES ON workflow_logs TO authenticated;
GRANT ALL PRIVILEGES ON workflow_impediments TO authenticated;
GRANT ALL PRIVILEGES ON workflow_strategic_info TO authenticated;

-- Create trigger functions for automatic logging
CREATE OR REPLACE FUNCTION log_workflow_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO workflow_logs (workflow_id, user_id, action, description, new_data)
        VALUES (NEW.id, auth.uid(), 'CREATE', 'Workflow criado', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO workflow_logs (workflow_id, user_id, action, description, old_data, new_data)
        VALUES (NEW.id, auth.uid(), 'UPDATE', 'Workflow atualizado', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO workflow_logs (workflow_id, user_id, action, description, old_data)
        VALUES (OLD.id, auth.uid(), 'DELETE', 'Workflow excluído', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_workflow_task_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO workflow_logs (workflow_id, user_id, action, description, new_data)
        VALUES (NEW.workflow_id, auth.uid(), 'TASK_CREATE', 'Tarefa criada: ' || NEW.title, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO workflow_logs (workflow_id, user_id, action, description, old_data, new_data)
        VALUES (NEW.workflow_id, auth.uid(), 'TASK_UPDATE', 'Tarefa atualizada: ' || NEW.title, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO workflow_logs (workflow_id, user_id, action, description, old_data)
        VALUES (OLD.workflow_id, auth.uid(), 'TASK_DELETE', 'Tarefa excluída: ' || OLD.title, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_workflow_comment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO workflow_logs (workflow_id, user_id, action, description, new_data)
        VALUES (NEW.workflow_id, auth.uid(), 'COMMENT_CREATE', 'Comentário adicionado', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO workflow_logs (workflow_id, user_id, action, description, old_data, new_data)
        VALUES (NEW.workflow_id, auth.uid(), 'COMMENT_UPDATE', 'Comentário atualizado', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO workflow_logs (workflow_id, user_id, action, description, old_data)
        VALUES (OLD.workflow_id, auth.uid(), 'COMMENT_DELETE', 'Comentário excluído', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic logging
CREATE TRIGGER workflow_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON workflows
    FOR EACH ROW EXECUTE FUNCTION log_workflow_changes();

CREATE TRIGGER workflow_task_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON workflow_tasks
    FOR EACH ROW EXECUTE FUNCTION log_workflow_task_changes();

CREATE TRIGGER workflow_comment_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON workflow_comments
    FOR EACH ROW EXECUTE FUNCTION log_workflow_comment_changes();

-- Insert sample data
INSERT INTO workflows (name, description, category, created_by, start_date, end_date, status)
VALUES 
    ('Melhoria do Processo de Vendas', 'Iniciativa para otimizar o processo de vendas pessoal', 'melhoria', auth.uid(), '2024-01-15', '2024-06-15', 'em_andamento'),
    ('Implementação de Nova Tecnologia', 'Iniciativa para implementar nova stack tecnológica', 'iniciativa', auth.uid(), '2024-02-01', '2024-08-01', 'planejamento');

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for updated_at columns
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_stages_updated_at BEFORE UPDATE ON workflow_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_tasks_updated_at BEFORE UPDATE ON workflow_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_comments_updated_at BEFORE UPDATE ON workflow_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_impediments_updated_at BEFORE UPDATE ON workflow_impediments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_strategic_info_updated_at BEFORE UPDATE ON workflow_strategic_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment on tables
COMMENT ON TABLE workflows IS 'Tabela principal de fluxos de trabalho';
COMMENT ON TABLE workflow_stages IS 'Etapas dos fluxos de trabalho';
COMMENT ON TABLE workflow_tasks IS 'Tarefas dos fluxos de trabalho';
COMMENT ON TABLE workflow_attachments IS 'Anexos dos fluxos de trabalho';
COMMENT ON TABLE workflow_comments IS 'Comentários dos fluxos de trabalho';
COMMENT ON TABLE workflow_logs IS 'Logs de auditoria dos fluxos de trabalho';
COMMENT ON TABLE workflow_impediments IS 'Impedimentos dos fluxos de trabalho';
COMMENT ON TABLE workflow_strategic_info IS 'Informações estratégicas dos fluxos de trabalho';