-- Create strategic objectives table
CREATE TABLE strategic_objectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create strategic pillars table
CREATE TABLE strategic_pillars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Default blue color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_tags junction table for many-to-many relationship
CREATE TABLE project_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, tag_id)
);

-- Add strategic columns to projects table
ALTER TABLE projects ADD COLUMN strategic_objective_id UUID REFERENCES strategic_objectives(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN strategic_pillar_id UUID REFERENCES strategic_pillars(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN request_date DATE;
ALTER TABLE projects ADD COLUMN committee_approval_date DATE;
ALTER TABLE projects ADD COLUMN real_start_date DATE;
ALTER TABLE projects ADD COLUMN real_end_date DATE;

-- Create indexes for better performance
CREATE INDEX idx_projects_strategic_objective ON projects(strategic_objective_id);
CREATE INDEX idx_projects_strategic_pillar ON projects(strategic_pillar_id);
CREATE INDEX idx_project_tags_project_id ON project_tags(project_id);
CREATE INDEX idx_project_tags_tag_id ON project_tags(tag_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_strategic_objectives_name ON strategic_objectives(name);
CREATE INDEX idx_strategic_pillars_name ON strategic_pillars(name);

-- Enable RLS (Row Level Security)
ALTER TABLE strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for strategic_objectives
CREATE POLICY "Users can view strategic objectives" ON strategic_objectives
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert strategic objectives" ON strategic_objectives
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update strategic objectives" ON strategic_objectives
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete strategic objectives" ON strategic_objectives
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for strategic_pillars
CREATE POLICY "Users can view strategic pillars" ON strategic_pillars
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert strategic pillars" ON strategic_pillars
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update strategic pillars" ON strategic_pillars
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete strategic pillars" ON strategic_pillars
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for tags
CREATE POLICY "Users can view tags" ON tags
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert tags" ON tags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tags" ON tags
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tags" ON tags
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for project_tags
CREATE POLICY "Users can view project tags" ON project_tags
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage project tags" ON project_tags
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert some default strategic objectives
INSERT INTO strategic_objectives (name, description) VALUES
    ('Crescimento de Receita', 'Aumentar a receita da organização através de novos produtos e mercados'),
    ('Eficiência Operacional', 'Melhorar a eficiência dos processos internos e reduzir custos'),
    ('Inovação e Tecnologia', 'Desenvolver capacidades tecnológicas e promover inovação'),
    ('Sustentabilidade', 'Implementar práticas sustentáveis e responsabilidade social'),
    ('Experiência do Cliente', 'Melhorar a satisfação e experiência dos clientes');

-- Insert some default strategic pillars
INSERT INTO strategic_pillars (name, description) VALUES
    ('Pessoas e Cultura', 'Desenvolvimento de talentos e fortalecimento da cultura organizacional'),
    ('Processos e Tecnologia', 'Otimização de processos e adoção de novas tecnologias'),
    ('Produtos e Serviços', 'Desenvolvimento e melhoria de produtos e serviços'),
    ('Mercado e Clientes', 'Expansão de mercado e relacionamento com clientes'),
    ('Financeiro e Governança', 'Gestão financeira e governança corporativa');

-- Insert some default tags
INSERT INTO tags (name, color) VALUES
    ('Urgente', '#EF4444'),
    ('Estratégico', '#8B5CF6'),
    ('Inovação', '#06B6D4'),
    ('Melhoria', '#10B981'),
    ('Compliance', '#F59E0B'),
    ('Digital', '#3B82F6');

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON strategic_objectives TO anon, authenticated;
GRANT ALL PRIVILEGES ON strategic_objectives TO authenticated;

GRANT SELECT ON strategic_pillars TO anon, authenticated;
GRANT ALL PRIVILEGES ON strategic_pillars TO authenticated;

GRANT SELECT ON tags TO anon, authenticated;
GRANT ALL PRIVILEGES ON tags TO authenticated;

GRANT SELECT ON project_tags TO anon, authenticated;
GRANT ALL PRIVILEGES ON project_tags TO authenticated;