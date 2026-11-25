CREATE OR REPLACE FUNCTION public.salvar_expedicao_atomico(
  p_existing_id uuid DEFAULT NULL,
  p_exp jsonb DEFAULT '{}'::jsonb,
  p_grade jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_exp_id uuid;
  v_locked_id uuid;
BEGIN
  IF NOT public.can_edit_any_route(auth.uid(), ARRAY['/expedicao']) THEN
    RAISE EXCEPTION 'Sem permissão para editar expedição.';
  END IF;

  IF p_existing_id IS NOT NULL THEN
    SELECT id INTO v_locked_id
    FROM public.expedicao
    WHERE id = p_existing_id
    FOR UPDATE;

    IF v_locked_id IS NULL THEN
      RAISE EXCEPTION 'Registro de expedição não encontrado para atualização.';
    END IF;

    UPDATE public.expedicao
    SET
      ordem_corte_id = COALESCE(NULLIF(TRIM(COALESCE(p_exp->>'ordem_corte_id', '')), '')::uuid, ordem_corte_id),
      data_saida = NULLIF(TRIM(COALESCE(p_exp->>'data_saida', '')), '')::date,
      oficina_id = NULLIF(TRIM(COALESCE(p_exp->>'oficina_id', '')), '')::uuid,
      oficina_nome = NULLIF(TRIM(COALESCE(p_exp->>'oficina_nome', '')), ''),
      preco_peca = COALESCE(NULLIF(TRIM(COALESCE(p_exp->>'preco_peca', '')), '')::numeric, 0),
      observacoes = NULLIF(TRIM(COALESCE(p_exp->>'observacoes', '')), ''),
      status = COALESCE(NULLIF(TRIM(COALESCE(p_exp->>'status', '')), ''), 'pendente'),
      updated_at = now()
    WHERE id = p_existing_id;

    v_exp_id := p_existing_id;

    DELETE FROM public.grade_expedicao WHERE expedicao_id = v_exp_id;
  ELSE
    INSERT INTO public.expedicao (
      ordem_corte_id,
      data_saida,
      oficina_id,
      oficina_nome,
      preco_peca,
      observacoes,
      status,
      created_by
    )
    VALUES (
      NULLIF(TRIM(COALESCE(p_exp->>'ordem_corte_id', '')), '')::uuid,
      NULLIF(TRIM(COALESCE(p_exp->>'data_saida', '')), '')::date,
      NULLIF(TRIM(COALESCE(p_exp->>'oficina_id', '')), '')::uuid,
      NULLIF(TRIM(COALESCE(p_exp->>'oficina_nome', '')), ''),
      COALESCE(NULLIF(TRIM(COALESCE(p_exp->>'preco_peca', '')), '')::numeric, 0),
      NULLIF(TRIM(COALESCE(p_exp->>'observacoes', '')), ''),
      COALESCE(NULLIF(TRIM(COALESCE(p_exp->>'status', '')), ''), 'pendente'),
      auth.uid()
    )
    RETURNING id INTO v_exp_id;
  END IF;

  IF jsonb_typeof(COALESCE(p_grade, '[]'::jsonb)) = 'array' AND jsonb_array_length(COALESCE(p_grade, '[]'::jsonb)) > 0 THEN
    INSERT INTO public.grade_expedicao (
      expedicao_id, cor,
      pp_prod, p_prod, m_prod, g_prod, gg_prod, g1_prod, g2_prod, g3_prod,
      pp_exp, p_exp, m_exp, g_exp, gg_exp, g1_exp, g2_exp, g3_exp
    )
    SELECT
      v_exp_id,
      TRIM(x.cor),
      COALESCE(x.pp_prod, 0), COALESCE(x.p_prod, 0), COALESCE(x.m_prod, 0), COALESCE(x.g_prod, 0),
      COALESCE(x.gg_prod, 0), COALESCE(x.g1_prod, 0), COALESCE(x.g2_prod, 0), COALESCE(x.g3_prod, 0),
      COALESCE(x.pp_exp, 0), COALESCE(x.p_exp, 0), COALESCE(x.m_exp, 0), COALESCE(x.g_exp, 0),
      COALESCE(x.gg_exp, 0), COALESCE(x.g1_exp, 0), COALESCE(x.g2_exp, 0), COALESCE(x.g3_exp, 0)
    FROM jsonb_to_recordset(p_grade) AS x(
      cor text,
      pp_prod integer, p_prod integer, m_prod integer, g_prod integer,
      gg_prod integer, g1_prod integer, g2_prod integer, g3_prod integer,
      pp_exp integer, p_exp integer, m_exp integer, g_exp integer,
      gg_exp integer, g1_exp integer, g2_exp integer, g3_exp integer
    );
  END IF;

  RETURN v_exp_id;
END;
$$;

REVOKE ALL ON FUNCTION public.salvar_expedicao_atomico(uuid, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_expedicao_atomico(uuid, jsonb, jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.substituir_filhos_modelo_atomico(
  p_modelo_id uuid,
  p_aviamentos jsonb DEFAULT NULL,
  p_gradacao jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_locked_id uuid;
BEGIN
  IF NOT public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']) THEN
    RAISE EXCEPTION 'Sem permissão para editar itens do modelo.';
  END IF;

  SELECT id INTO v_locked_id
  FROM public.modelos
  WHERE id = p_modelo_id
  FOR UPDATE;

  IF v_locked_id IS NULL THEN
    RAISE EXCEPTION 'Modelo não encontrado.';
  END IF;

  IF p_aviamentos IS NOT NULL THEN
    DELETE FROM public.modelo_aviamentos WHERE modelo_id = p_modelo_id;
    IF jsonb_typeof(p_aviamentos) = 'array' AND jsonb_array_length(p_aviamentos) > 0 THEN
      INSERT INTO public.modelo_aviamentos (modelo_id, ordem, descricao, quantidade, unidade, observacao)
      SELECT
        p_modelo_id,
        COALESCE(x.ordem, 0),
        x.descricao,
        x.quantidade,
        x.unidade,
        x.observacao
      FROM jsonb_to_recordset(p_aviamentos) AS x(
        ordem integer,
        descricao text,
        quantidade numeric,
        unidade text,
        observacao text
      );
    END IF;
  END IF;

  IF p_gradacao IS NOT NULL THEN
    DELETE FROM public.modelo_gradacao WHERE modelo_id = p_modelo_id;
    IF jsonb_typeof(p_gradacao) = 'array' AND jsonb_array_length(p_gradacao) > 0 THEN
      INSERT INTO public.modelo_gradacao (modelo_id, ordem, tamanho, medida_a, medida_b, medida_c, medida_d, observacao)
      SELECT
        p_modelo_id,
        COALESCE(x.ordem, 0),
        x.tamanho,
        x.medida_a,
        x.medida_b,
        x.medida_c,
        x.medida_d,
        x.observacao
      FROM jsonb_to_recordset(p_gradacao) AS x(
        ordem integer,
        tamanho text,
        medida_a numeric,
        medida_b numeric,
        medida_c numeric,
        medida_d numeric,
        observacao text
      );
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.substituir_filhos_modelo_atomico(uuid, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.substituir_filhos_modelo_atomico(uuid, jsonb, jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.substituir_aviamentos_pedido_atomico(
  p_numero_pedido text,
  p_aviamentos jsonb DEFAULT '[]'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_locked text;
BEGIN
  IF NOT public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']) THEN
    RAISE EXCEPTION 'Sem permissão para editar aviamentos do pedido.';
  END IF;

  SELECT numero_pedido INTO v_locked
  FROM public.modelo_pedidos
  WHERE numero_pedido = p_numero_pedido
  FOR UPDATE;

  IF v_locked IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;

  DELETE FROM public.aviamentos_pedido WHERE numero_pedido = p_numero_pedido;

  IF jsonb_typeof(COALESCE(p_aviamentos, '[]'::jsonb)) = 'array' AND jsonb_array_length(COALESCE(p_aviamentos, '[]'::jsonb)) > 0 THEN
    INSERT INTO public.aviamentos_pedido (
      numero_pedido, modelo_ref, tipo, descricao_item, cor, tamanho, partes_qtde
    )
    SELECT
      p_numero_pedido,
      x.modelo_ref,
      x.tipo,
      x.descricao_item,
      x.cor,
      x.tamanho,
      x.partes_qtde
    FROM jsonb_to_recordset(p_aviamentos) AS x(
      modelo_ref text,
      tipo text,
      descricao_item text,
      cor text,
      tamanho text,
      partes_qtde numeric
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.substituir_aviamentos_pedido_atomico(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.substituir_aviamentos_pedido_atomico(text, jsonb) TO authenticated, service_role;