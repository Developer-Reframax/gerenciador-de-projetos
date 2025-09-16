-- Adicionar membros faltantes ao time 'Desenvolvimento de rateio'
-- ID do time: 015bd8ff-cefe-43a2-bdde-653424cc5dbd
-- Vamos adicionar os mesmos usuários que estão no time 'Equipe de TI'

INSERT INTO team_members (id, team_id, user_id, role, status, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    '015bd8ff-cefe-43a2-bdde-653424cc5dbd', -- Desenvolvimento de rateio
    '4eda5ef3-e825-4a7e-891c-496057d01716', -- Mesmo user_id do segundo membro do time TI
    'member',
    'active',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '015bd8ff-cefe-43a2-bdde-653424cc5dbd', -- Desenvolvimento de rateio
    'ebdcb08f-6983-4956-b0f2-5661931bcb76', -- Mesmo user_id do terceiro membro do time TI
    'member',
    'active',
    NOW(),
    NOW()
  );

-- Verificar o resultado
SELECT 
  t.name as team_name,
  COUNT(tm.id) as total_members
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
GROUP BY t.id, t.name
ORDER BY t.name;