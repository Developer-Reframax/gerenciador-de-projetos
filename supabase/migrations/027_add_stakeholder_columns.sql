-- Migration: Adicionar colunas de role, influence_level e interest_level à tabela project_stakeholders
-- Data: 2024
-- Descrição: Adicionar campos necessários para gerenciar stakeholders com níveis de influência e interesse

-- Adicionar colunas à tabela project_stakeholders
ALTER TABLE project_stakeholders 
ADD COLUMN role VARCHAR(100) DEFAULT 'stakeholder',
ADD COLUMN influence_level VARCHAR(20) DEFAULT 'medium' CHECK (influence_level IN ('low', 'medium', 'high')),
ADD COLUMN interest_level VARCHAR(20) DEFAULT 'medium' CHECK (interest_level IN ('low', 'medium', 'high'));

-- Criar índices para as novas colunas
CREATE INDEX idx_project_stakeholders_role ON project_stakeholders(role);
CREATE INDEX idx_project_stakeholders_influence_level ON project_stakeholders(influence_level);
CREATE INDEX idx_project_stakeholders_interest_level ON project_stakeholders(interest_level);

-- Comentários para documentação
COMMENT ON COLUMN project_stakeholders.role IS 'Papel do stakeholder no projeto';
COMMENT ON COLUMN project_stakeholders.influence_level IS 'Nível de influência do stakeholder (low, medium, high)';
COMMENT ON COLUMN project_stakeholders.interest_level IS 'Nível de interesse do stakeholder (low, medium, high)';