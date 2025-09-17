-- Migration: Atualizar políticas RLS para áreas e stakeholders
-- Data: 2024
-- Descrição: Atualizar políticas de segurança para project_areas e project_stakeholders

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Users can view project areas" ON project_areas;
DROP POLICY IF EXISTS "Users can manage project areas" ON project_areas;
DROP POLICY IF EXISTS "Users can view project stakeholders" ON project_stakeholders;
DROP POLICY IF EXISTS "Users can manage project stakeholders" ON project_stakeholders;

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

-- Garantir permissões para os roles anon e authenticated
GRANT SELECT ON areas TO anon, authenticated;
GRANT ALL PRIVILEGES ON project_areas TO authenticated;
GRANT ALL PRIVILEGES ON project_stakeholders TO authenticated;