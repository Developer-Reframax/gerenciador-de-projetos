-- Função RPC para atualizar posições de stages em uma única transação
-- Resolve o problema de constraint única durante drag-and-drop

CREATE OR REPLACE FUNCTION update_stage_positions(
  p_project_id UUID,
  p_stages JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stage_item JSONB;
  stage_id UUID;
  stage_position INTEGER;
BEGIN
  -- Verificar se o usuário tem acesso ao projeto
  IF NOT EXISTS (
    SELECT 1 FROM public.projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = p_project_id
    AND (p.created_by = auth.uid() OR tm.user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Acesso negado ao projeto';
  END IF;

  -- Desabilitar temporariamente os triggers de reordenação
  -- para evitar conflitos durante a atualização em lote
  ALTER TABLE public.stages DISABLE TRIGGER reorder_stages_on_update_trigger;
  
  -- Atualizar as posições de todas as stages em uma única transação
  FOR stage_item IN SELECT * FROM jsonb_array_elements(p_stages)
  LOOP
    stage_id := (stage_item->>'id')::UUID;
    stage_position := COALESCE((stage_item->>'position')::INTEGER, (stage_item->>'order_index')::INTEGER);
    
    -- Verificar se a stage pertence ao projeto
    IF EXISTS (
      SELECT 1 FROM public.stages 
      WHERE id = stage_id AND project_id = p_project_id
    ) THEN
      UPDATE public.stages 
      SET order_index = stage_position,
          updated_at = NOW()
      WHERE id = stage_id;
    END IF;
  END LOOP;
  
  -- Reabilitar os triggers
  ALTER TABLE public.stages ENABLE TRIGGER reorder_stages_on_update_trigger;
  
  -- Executar uma reordenação final para garantir consistência
  -- (caso haja gaps ou duplicatas)
  UPDATE public.stages 
  SET order_index = subquery.new_position
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY order_index, created_at) as new_position
    FROM public.stages 
    WHERE project_id = p_project_id
  ) AS subquery
  WHERE public.stages.id = subquery.id;
  
END;
$$;

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION update_stage_positions(UUID, JSONB) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION update_stage_positions(UUID, JSONB) IS 
'Atualiza as posições de múltiplas stages em uma única transação, evitando conflitos de constraint única durante drag-and-drop';