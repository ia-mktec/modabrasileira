CREATE OR REPLACE FUNCTION public.salvar_ordem_corte_atomico(
  p_existing_id uuid DEFAULT NULL,
  p_ordem jsonb DEFAULT '{}'::jsonb,
  p_grade jsonb DEFAULT '[]'::jsonb,
  p_aviamentos jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_ordem_id uuid;
  v_numero text := NULLIF(TRIM(COALESCE(p_ordem->>'numero', '')), '');
  v_locked_id uuid;
BEGIN
  IF NOT public.can_edit_any_route(auth.uid(), ARRAY['/corte']) THEN
    RAISE EXCEPTION 'Sem permissão para editar ordens de corte.';
  END IF;

  IF v_numero IS NULL THEN
    RAISE EXCEPTION 'Número da ordem de corte é obrigatório.';
  END IF;

  IF EXISTS (
    SELECT lower(trim(x.cor))
    FROM jsonb_to_recordset(COALESCE(p_grade, '[]'::jsonb)) AS x(cor text)
    WHERE trim(COALESCE(x.cor, '')) <> ''
    GROUP BY lower(trim(x.cor))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existem cores duplicadas na grade da ordem de corte.';
  END IF;

  IF p_existing_id IS NOT NULL THEN
    SELECT id INTO v_locked_id
    FROM public.ordens_corte
    WHERE id = p_existing_id
    FOR UPDATE;

    IF v_locked_id IS NULL THEN
      RAISE EXCEPTION 'Ordem de corte não encontrada para atualização.';
    END IF;

    UPDATE public.ordens_corte
    SET
      numero = v_numero,
      modelo_ref = NULLIF(TRIM(COALESCE(p_ordem->>'modelo_ref', '')), ''),
      modelo_id = NULLIF(TRIM(COALESCE(p_ordem->>'modelo_id', '')), '')::uuid,
      tecido_nome = NULLIF(TRIM(COALESCE(p_ordem->>'tecido_nome', '')), ''),
      tecido_id = NULLIF(TRIM(COALESCE(p_ordem->>'tecido_id', '')), '')::uuid,
      cliente_id = NULLIF(TRIM(COALESCE(p_ordem->>'cliente_id', '')), '')::uuid,
      quantidade_pecas = COALESCE(NULLIF(TRIM(COALESCE(p_ordem->>'quantidade_pecas', '')), '')::integer, 0),
      data_corte = NULLIF(TRIM(COALESCE(p_ordem->>'data_corte', '')), '')::date,
      cortador = NULLIF(TRIM(COALESCE(p_ordem->>'cortador', '')), ''),
      enfestador = NULLIF(TRIM(COALESCE(p_ordem->>'enfestador', '')), ''),
      enfestos = COALESCE(NULLIF(TRIM(COALESCE(p_ordem->>'enfestos', '')), '')::integer, enfestos),
      perda_percent = COALESCE(NULLIF(TRIM(COALESCE(p_ordem->>'perda_percent', '')), '')::numeric, 0),
      consumo_por_peca = COALESCE(NULLIF(TRIM(COALESCE(p_ordem->>'consumo_por_peca', '')), '')::numeric, 0),
      observacoes = NULLIF(TRIM(COALESCE(p_ordem->>'observacoes', '')), ''),
      status = COALESCE(NULLIF(TRIM(COALESCE(p_ordem->>'status', '')), ''), 'pendente'),
      numero_pedido = NULLIF(TRIM(COALESCE(p_ordem->>'numero_pedido', '')), ''),
      updated_at = now()
    WHERE id = p_existing_id;

    v_ordem_id := p_existing_id;

    DELETE FROM public.grade_corte WHERE ordem_corte_id = v_ordem_id;
    DELETE FROM public.aviamentos_ordem WHERE ordem_corte_id = v_ordem_id;
  ELSE
    PERFORM pg_advisory_xact_lock(5408475, hashtext(lower(v_numero)));

    IF EXISTS (
      SELECT 1 FROM public.ordens_corte WHERE lower(trim(numero)) = lower(v_numero)
    ) THEN
      RAISE EXCEPTION 'Já existe uma ordem de corte com o número %.', v_numero;
    END IF;

    INSERT INTO public.ordens_corte (
      numero,
      modelo_ref,
      modelo_id,
      tecido_nome,
      tecido_id,
      cliente_id,
      quantidade_pecas,
      data_corte,
      cortador,
      enfestador,
      enfestos,
      perda_percent,
      consumo_por_peca,
      observacoes,
      status,
      numero_pedido,
      created_by
    )
    VALUES (
      v_numero,
      NULLIF(TRIM(COALESCE(p_ordem->>'modelo_ref', '')), ''),
      NULLIF(TRIM(COALESCE(p_ordem->>'modelo_id', '')), '')::uuid,
      NULLIF(TRIM(COALESCE(p_ordem->>'tecido_nome', '')), ''),
      NULLIF(TRIM(COALESCE(p_ordem->>'tecido_id', '')), '')::uuid,
      NULLIF(TRIM(COALESCE(p_ordem->>'cliente_id', '')), '')::uuid,
      COALESCE(NULLIF(TRIM(COALESCE(p_ordem->>'quantidade_pecas', '')), '')::integer, 0),
      NULLIF(TRIM(COALESCE(p_ordem->>'data_corte', '')), '')::date,
      NULLIF(TRIM(COALESCE(p_ordem->>'cortador', '')), ''),
      NULLIF(TRIM(COALESCE(p_ordem->>'enfestador', '')), ''),
      COALESCE(NULLIF(TRIM(COALESCE(p_ordem->>'enfestos', '')), '')::integer, 0),
      COALESCE(NULLIF(TRIM(COALESCE(p_ordem->>'perda_percent', '')), '')::numeric, 0),
      COALESCE(NULLIF(TRIM(COALESCE(p_ordem->>'consumo_por_peca', '')), '')::numeric, 0),
      NULLIF(TRIM(COALESCE(p_ordem->>'observacoes', '')), ''),
      COALESCE(NULLIF(TRIM(COALESCE(p_ordem->>'status', '')), ''), 'pendente'),
      NULLIF(TRIM(COALESCE(p_ordem->>'numero_pedido', '')), ''),
      auth.uid()
    )
    RETURNING id INTO v_ordem_id;
  END IF;

  IF jsonb_typeof(COALESCE(p_grade, '[]'::jsonb)) = 'array' AND jsonb_array_length(COALESCE(p_grade, '[]'::jsonb)) > 0 THEN
    INSERT INTO public.grade_corte (
      ordem_corte_id,
      cor,
      tecido_id,
      pp, p, m, g, gg, g1, g2, g3
    )
    SELECT
      v_ordem_id,
      TRIM(x.cor),
      NULLIF(TRIM(COALESCE(x.tecido_id, '')), '')::uuid,
      COALESCE(x.pp, 0),
      COALESCE(x.p, 0),
      COALESCE(x.m, 0),
      COALESCE(x.g, 0),
      COALESCE(x.gg, 0),
      COALESCE(x.g1, 0),
      COALESCE(x.g2, 0),
      COALESCE(x.g3, 0)
    FROM jsonb_to_recordset(p_grade) AS x(
      cor text,
      tecido_id text,
      pp integer,
      p integer,
      m integer,
      g integer,
      gg integer,
      g1 integer,
      g2 integer,
      g3 integer
    );
  END IF;

  IF jsonb_typeof(COALESCE(p_aviamentos, '[]'::jsonb)) = 'array' AND jsonb_array_length(COALESCE(p_aviamentos, '[]'::jsonb)) > 0 THEN
    INSERT INTO public.aviamentos_ordem (
      ordem_corte_id,
      descricao,
      quantidade
    )
    SELECT
      v_ordem_id,
      TRIM(x.descricao),
      COALESCE(x.quantidade, 0)
    FROM jsonb_to_recordset(p_aviamentos) AS x(
      descricao text,
      quantidade integer
    );
  END IF;

  RETURN v_ordem_id;
END;
$$;

REVOKE ALL ON FUNCTION public.salvar_ordem_corte_atomico(uuid, jsonb, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_ordem_corte_atomico(uuid, jsonb, jsonb, jsonb) TO authenticated, service_role;