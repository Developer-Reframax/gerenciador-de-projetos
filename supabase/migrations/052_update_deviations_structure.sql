-- Migração para reestruturar desvios
-- 1. Remover campos 'Foi solicitado?' e 'Solicitante'
-- 2. Atualizar enum 'tipo de impacto' com novas opções

-- 1. Primeiro, remover o constraint antigo do impact_type
ALTER TABLE project_deviations DROP CONSTRAINT IF EXISTS project_deviations_impact_type_check;

-- 2. Atualizar dados existentes para as novas opções
UPDATE project_deviations 
SET impact_type = CASE 
    WHEN impact_type = 'Custo/orçamento' THEN 'Custo/Orçamento'
    WHEN impact_type = 'Aumento de escopo' THEN 'Escopo/Entregas'
    WHEN impact_type = 'Não se aplica' AND evaluation_criteria = 'Fatores externo' THEN 'Recursos/Equipe'
    WHEN impact_type = 'Não se aplica' AND evaluation_criteria = 'Inovação' THEN 'Qualidade'
    WHEN impact_type = 'Não se aplica' AND evaluation_criteria = 'Medida corretiva' THEN 'Prazo/Cronograma'
    WHEN impact_type = 'Não se aplica' AND evaluation_criteria = 'Melhorias' THEN 'Qualidade'
    WHEN impact_type = 'Não se aplica' AND evaluation_criteria = 'Repriorização' THEN 'Escopo/Entregas'
    WHEN impact_type = 'Não se aplica' THEN 'Qualidade'
    ELSE 'Qualidade'
END;

-- 3. Criar novo constraint do impact_type com novas opções
ALTER TABLE project_deviations ADD CONSTRAINT project_deviations_impact_type_check 
    CHECK (impact_type IN (
        'Custo/Orçamento', 
        'Prazo/Cronograma', 
        'Escopo/Entregas', 
        'Qualidade', 
        'Recursos/Equipe'
    ));

-- 4. Remover colunas desnecessárias
ALTER TABLE project_deviations DROP COLUMN IF EXISTS was_requested;
ALTER TABLE project_deviations DROP COLUMN IF EXISTS requested_by;

-- 5. Remover foreign key constraint relacionado ao campo requested_by
ALTER TABLE project_deviations DROP CONSTRAINT IF EXISTS project_deviations_requested_by_fkey;

-- 6. Atualizar políticas RLS para remover referências aos campos removidos
DROP POLICY IF EXISTS "Users can update their deviations or approve" ON project_deviations;

-- Recriar política de atualização sem referência ao requested_by
CREATE POLICY "Users can update deviations or approve" ON project_deviations
    FOR UPDATE USING (
        auth.uid() = approver_id OR
        auth.uid() IN (
            SELECT user_id FROM team_members tm
            JOIN projects p ON p.team_id = tm.team_id
            WHERE p.id = project_id AND tm.role IN ('admin', 'manager')
        )
    );