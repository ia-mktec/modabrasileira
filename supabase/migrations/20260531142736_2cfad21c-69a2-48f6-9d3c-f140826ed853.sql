DO $$
DECLARE
  r RECORD;
  novo_estoque numeric;
BEGIN
  FOR r IN
    SELECT
      oc.id AS ordem_id,
      oc.numero,
      COALESCE(gc.tecido_id, oc.tecido_id) AS tecido_id,
      SUM(COALESCE(gc.pp,0)+COALESCE(gc.p,0)+COALESCE(gc.m,0)+COALESCE(gc.g,0)
        + COALESCE(gc.gg,0)+COALESCE(gc.g1,0)+COALESCE(gc.g2,0)+COALESCE(gc.g3,0)) AS pecas,
      oc.consumo_por_peca
    FROM public.ordens_corte oc
    JOIN public.grade_corte gc ON gc.ordem_corte_id = oc.id
    WHERE oc.status = 'concluido'
      AND oc.consumo_por_peca IS NOT NULL
      AND oc.consumo_por_peca > 0
    GROUP BY oc.id, oc.numero, COALESCE(gc.tecido_id, oc.tecido_id), oc.consumo_por_peca
  LOOP
    IF r.tecido_id IS NULL OR r.pecas <= 0 THEN
      CONTINUE;
    END IF;

    -- Pula se já existe baixa registrada para essa OC + tecido
    IF EXISTS (
      SELECT 1 FROM public.estoque_movimentacoes
      WHERE ordem_corte_id = r.ordem_id
        AND tecido_id = r.tecido_id
        AND tipo = 'saida'
    ) THEN
      CONTINUE;
    END IF;

    -- Decrementa estoque (não permite negativo)
    UPDATE public.tecidos
       SET estoque_kg = GREATEST(0, COALESCE(estoque_kg, 0) - (r.pecas * r.consumo_por_peca))
     WHERE id = r.tecido_id
    RETURNING estoque_kg INTO novo_estoque;

    -- Registra movimentação de saída
    INSERT INTO public.estoque_movimentacoes
      (tecido_id, quantidade_kg, ordem_corte_id, tipo, descricao)
    VALUES
      (r.tecido_id, r.pecas * r.consumo_por_peca, r.ordem_id, 'saida',
       'Baixa retroativa OC ' || r.numero || ' — ' || r.pecas || ' peças');
  END LOOP;
END $$;