-- Migração para criar tabelas de Itens de Trabalho (Risks e Impediments)
-- Data: 2024-01-27
-- Descrição: Criação das tabelas risks e impediments com políticas RLS e índices

-- Criar tabela de riscos
CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'identificado' 
        CHECK (status IN ('identificado', 'em_analise', 'em_mitigacao', 'monitorado', 'materializado', 'encerrado')),
    impact VARCHAR(20) NOT NULL 
        CHECK (impact IN ('prazo', 'custo', 'qualidade', 'reputacao')),
    probability VARCHAR(10) NOT NULL 
        CHECK (probability IN ('baixa', 'media', 'alta')),
    responsible_id UUID NOT NULL,
    identification_date DATE NOT NULL,
    expected_resolution_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_risks_stage FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
    CONSTRAINT fk_risks_responsible FOREIGN KEY (responsible_id) REFERENCES users(id)
);

-- Criar índices para risks
CREATE INDEX idx_risks_stage_id ON risks(stage_id);
CREATE INDEX idx_risks_responsible_id ON risks(responsible_id);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_identification_date ON risks(identification_date DESC);

-- Habilitar RLS para risks
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para risks
CREATE POLICY "Usuários podem ver riscos de projetos que participam" ON risks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stages s
            JOIN projects p ON s.project_id = p.id
            JOIN team_members tm ON p.team_id = tm.team_id
            WHERE s.id = risks.stage_id AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar riscos em projetos que participam" ON risks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stages s
            JOIN projects p ON s.project_id = p.id
            JOIN team_members tm ON p.team_id = tm.team_id
            WHERE s.id = risks.stage_id AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Usuários podem atualizar riscos que são responsáveis ou em projetos que participam" ON risks
    FOR UPDATE USING (
        responsible_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM stages s
            JOIN projects p ON s.project_id = p.id
            JOIN team_members tm ON p.team_id = tm.team_id
            WHERE s.id = risks.stage_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Usuários podem deletar riscos em projetos que gerenciam" ON risks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM stages s
            JOIN projects p ON s.project_id = p.id
            JOIN team_members tm ON p.team_id = tm.team_id
            WHERE s.id = risks.stage_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
        )
    );

-- Criar tabela de impedimentos
CREATE TABLE impediments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL,
    description TEXT NOT NULL,
    identification_date DATE NOT NULL,
    responsible_id UUID NOT NULL,
    expected_resolution_date DATE,
    criticality VARCHAR(10) NOT NULL DEFAULT 'media'
        CHECK (criticality IN ('alta', 'media', 'baixa')),
    status VARCHAR(20) NOT NULL DEFAULT 'aberto'
        CHECK (status IN ('aberto', 'em_resolucao', 'resolvido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_impediments_stage FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
    CONSTRAINT fk_impediments_responsible FOREIGN KEY (responsible_id) REFERENCES users(id)
);

-- Criar índices para impediments
CREATE INDEX idx_impediments_stage_id ON impediments(stage_id);
CREATE INDEX idx_impediments_responsible_id ON impediments(responsible_id);
CREATE INDEX idx_impediments_criticality ON impediments(criticality);
CREATE INDEX idx_impediments_identification_date ON impediments(identification_date DESC);
CREATE INDEX idx_impediments_status ON impediments(status);

-- Habilitar RLS para impediments
ALTER TABLE impediments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para impediments
CREATE POLICY "Usuários podem ver impedimentos de projetos que participam" ON impediments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stages s
            JOIN projects p ON s.project_id = p.id
            JOIN team_members tm ON p.team_id = tm.team_id
            WHERE s.id = impediments.stage_id AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar impedimentos em projetos que participam" ON impediments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stages s
            JOIN projects p ON s.project_id = p.id
            JOIN team_members tm ON p.team_id = tm.team_id
            WHERE s.id = impediments.stage_id AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Usuários podem atualizar impedimentos que são responsáveis ou em projetos que participam" ON impediments
    FOR UPDATE USING (
        responsible_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM stages s
            JOIN projects p ON s.project_id = p.id
            JOIN team_members tm ON p.team_id = tm.team_id
            WHERE s.id = impediments.stage_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Usuários podem deletar impedimentos em projetos que gerenciam" ON impediments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM stages s
            JOIN projects p ON s.project_id = p.id
            JOIN team_members tm ON p.team_id = tm.team_id
            WHERE s.id = impediments.stage_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
        )
    );

-- Conceder permissões para as roles anon e authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON risks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impediments TO authenticated;
GRANT SELECT ON risks TO anon;
GRANT SELECT ON impediments TO anon;