-- Migration: Expansão do Módulo Estratégico - Áreas, Stakeholders e Lições Aprendidas
-- Criação das tabelas para áreas organizacionais, stakeholders e lições aprendidas

-- Criar tabela de áreas organizacionais
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para áreas
CREATE INDEX idx_areas_name ON areas(name);
CREATE INDEX idx_areas_created_at ON areas(created_at DESC);

-- Criar tabela de associação projeto-áreas
CREATE TABLE project_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, area_id)
);

-- Criar índices para project_areas
CREATE INDEX idx_project_areas_project_id ON project_areas(project_id);
CREATE INDEX idx_project_areas_area_id ON project_areas(area_id);

-- Criar tabela de stakeholders do projeto
CREATE TABLE project_stakeholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Criar índices para project_stakeholders
CREATE INDEX idx_project_stakeholders_project_id ON project_stakeholders(project_id);
CREATE INDEX idx_project_stakeholders_user_id ON project_stakeholders(user_id);

-- Adicionar coluna de lições aprendidas à tabela projects
ALTER TABLE projects ADD COLUMN lessons_learned TEXT;

-- Criar índice para busca de texto em lições aprendidas
CREATE INDEX idx_projects_lessons_learned ON projects USING gin(to_tsvector('portuguese', lessons_learned));

-- Habilitar RLS nas novas tabelas
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stakeholders ENABLE ROW LEVEL SECURITY;

-- Políticas para áreas (globais - todos podem ver)
CREATE POLICY "Áreas são visíveis para usuários autenticados" ON areas
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem criar áreas" ON areas
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar áreas" ON areas
    FOR UPDATE TO authenticated USING (true);

-- Políticas para project_areas
CREATE POLICY "Usuários podem ver áreas de projetos que participam" ON project_areas
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            JOIN projects p ON p.team_id = tm.team_id
            WHERE p.id = project_areas.project_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem gerenciar áreas de projetos que participam" ON project_areas
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            JOIN projects p ON p.team_id = tm.team_id
            WHERE p.id = project_areas.project_id
            AND tm.user_id = auth.uid()
        )
    );

-- Políticas para project_stakeholders
CREATE POLICY "Usuários podem ver stakeholders de projetos que participam" ON project_stakeholders
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            JOIN projects p ON p.team_id = tm.team_id
            WHERE p.id = project_stakeholders.project_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem gerenciar stakeholders de projetos que participam" ON project_stakeholders
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            JOIN projects p ON p.team_id = tm.team_id
            WHERE p.id = project_stakeholders.project_id
            AND tm.user_id = auth.uid()
        )
    );

-- Inserir dados iniciais de áreas
INSERT INTO areas (name, description, color) VALUES
('Tecnologia da Informação', 'Área responsável por sistemas e infraestrutura tecnológica', '#3B82F6'),
('Recursos Humanos', 'Gestão de pessoas e desenvolvimento organizacional', '#10B981'),
('Financeiro', 'Controle financeiro e orçamentário', '#F59E0B'),
('Marketing', 'Estratégias de marketing e comunicação', '#EF4444'),
('Operações', 'Processos operacionais e produção', '#8B5CF6');

-- Conceder permissões às roles anon e authenticated
GRANT SELECT ON areas TO anon;
GRANT ALL PRIVILEGES ON areas TO authenticated;
GRANT ALL PRIVILEGES ON project_areas TO authenticated;
GRANT ALL PRIVILEGES ON project_stakeholders TO authenticated;

-- Comentários para documentação
COMMENT ON TABLE areas IS 'Tabela de áreas organizacionais globais';
COMMENT ON TABLE project_areas IS 'Tabela de associação entre projetos e áreas';
COMMENT ON TABLE project_stakeholders IS 'Tabela de stakeholders por projeto';
COMMENT ON COLUMN projects.lessons_learned IS 'Campo de texto livre para lições aprendidas do projeto';