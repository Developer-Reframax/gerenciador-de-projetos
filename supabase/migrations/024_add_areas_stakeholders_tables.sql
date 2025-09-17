-- Create areas table
CREATE TABLE areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_areas junction table
CREATE TABLE project_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, area_id)
);

-- Create project_stakeholders junction table
CREATE TABLE project_stakeholders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_project_areas_project_id ON project_areas(project_id);
CREATE INDEX idx_project_areas_area_id ON project_areas(area_id);
CREATE INDEX idx_project_stakeholders_project_id ON project_stakeholders(project_id);
CREATE INDEX idx_project_stakeholders_user_id ON project_stakeholders(user_id);

-- Enable RLS
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stakeholders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for areas
CREATE POLICY "Areas are viewable by authenticated users" ON areas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Areas can be created by authenticated users" ON areas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Areas can be updated by authenticated users" ON areas
    FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for project_areas
CREATE POLICY "Project areas are viewable by authenticated users" ON project_areas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Project areas can be managed by authenticated users" ON project_areas
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for project_stakeholders
CREATE POLICY "Project stakeholders are viewable by authenticated users" ON project_stakeholders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Project stakeholders can be managed by authenticated users" ON project_stakeholders
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON areas TO anon;
GRANT ALL PRIVILEGES ON areas TO authenticated;

GRANT SELECT ON project_areas TO anon;
GRANT ALL PRIVILEGES ON project_areas TO authenticated;

GRANT SELECT ON project_stakeholders TO anon;
GRANT ALL PRIVILEGES ON project_stakeholders TO authenticated;

-- Insert some initial areas
INSERT INTO areas (name, description) VALUES
    ('Tecnologia da Informação', 'Área responsável por sistemas e infraestrutura tecnológica'),
    ('Recursos Humanos', 'Área responsável pela gestão de pessoas e talentos'),
    ('Financeiro', 'Área responsável pela gestão financeira e orçamentária'),
    ('Marketing', 'Área responsável pela comunicação e marketing'),
    ('Operações', 'Área responsável pelas operações e processos do negócio');