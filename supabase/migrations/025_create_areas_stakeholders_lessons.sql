-- Migration: Adicionar suporte para áreas, stakeholders e lições aprendidas

-- Criar tabela de áreas
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de relacionamento projeto-área
CREATE TABLE IF NOT EXISTS project_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, area_id)
);

-- Criar tabela de relacionamento projeto-stakeholder
CREATE TABLE IF NOT EXISTS project_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Adicionar campo de lições aprendidas na tabela projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_project_areas_project_id ON project_areas(project_id);
CREATE INDEX IF NOT EXISTS idx_project_areas_area_id ON project_areas(area_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_project_id ON project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_user_id ON project_stakeholders(user_id);
CREATE INDEX IF NOT EXISTS idx_areas_name ON areas(name);

-- Habilitar RLS (Row Level Security)
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stakeholders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para áreas
CREATE POLICY "Users can view all areas" ON areas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create areas" ON areas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update areas" ON areas
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete areas" ON areas
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para project_areas
CREATE POLICY "Users can view project areas if they can view the project" ON project_areas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_areas.project_id 
      AND (p.owner_id = auth.uid() OR p.visibility = 'public')
    )
  );

CREATE POLICY "Users can manage project areas if they can manage the project" ON project_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_areas.project_id 
      AND p.owner_id = auth.uid()
    )
  );

-- Políticas RLS para project_stakeholders
CREATE POLICY "Users can view project stakeholders if they can view the project" ON project_stakeholders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_stakeholders.project_id 
      AND (p.owner_id = auth.uid() OR p.visibility = 'public')
    )
  );

CREATE POLICY "Users can manage project stakeholders if they can manage the project" ON project_stakeholders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_stakeholders.project_id 
      AND p.owner_id = auth.uid()
    )
  );

-- Inserir algumas áreas padrão
INSERT INTO areas (name, description) VALUES
  ('Tecnologia da Informação', 'Área responsável por sistemas, infraestrutura e tecnologia'),
  ('Recursos Humanos', 'Área responsável por gestão de pessoas e desenvolvimento organizacional'),
  ('Financeiro', 'Área responsável por gestão financeira e orçamentária'),
  ('Marketing', 'Área responsável por marketing e comunicação'),
  ('Operações', 'Área responsável por operações e processos')
ON CONFLICT DO NOTHING;

-- Conceder permissões para roles anon e authenticated
GRANT SELECT ON areas TO anon, authenticated;
GRANT ALL ON areas TO authenticated;
GRANT ALL ON project_areas TO authenticated;
GRANT ALL ON project_stakeholders TO authenticated;