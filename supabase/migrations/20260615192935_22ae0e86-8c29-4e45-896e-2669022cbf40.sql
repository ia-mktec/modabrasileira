
-- A) Sync tecidos.estoque_kg from tecido_entradas via trigger

CREATE OR REPLACE FUNCTION public.recompute_tecido_estoque(
  p_cliente_id uuid,
  p_nome text,
  p_cor text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo numeric;
  v_composicao text;
  v_cliente_nome text;
BEGIN
  IF p_cliente_id IS NULL OR p_nome IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(metragem_total), 0)
    INTO v_saldo
  FROM public.tecido_entradas
  WHERE cliente_id = p_cliente_id
    AND nome_tecido = p_nome
    AND COALESCE(cor, '') = COALESCE(p_cor, '')
    AND COALESCE(status, '') NOT ILIKE 'aloc%';

  SELECT composicao, cliente_nome
    INTO v_composicao, v_cliente_nome
  FROM public.tecido_entradas
  WHERE cliente_id = p_cliente_id
    AND nome_tecido = p_nome
    AND COALESCE(cor, '') = COALESCE(p_cor, '')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Upsert na tabela tecidos (chave lógica: cliente_id + nome + cor)
  IF EXISTS (
    SELECT 1 FROM public.tecidos
    WHERE cliente_id = p_cliente_id
      AND nome = p_nome
      AND COALESCE(cor, '') = COALESCE(p_cor, '')
  ) THEN
    UPDATE public.tecidos
       SET estoque_kg = v_saldo,
           status = CASE WHEN v_saldo > 0 THEN 'disponivel' ELSE 'indisponivel' END,
           updated_at = now()
     WHERE cliente_id = p_cliente_id
       AND nome = p_nome
       AND COALESCE(cor, '') = COALESCE(p_cor, '');
  ELSIF v_saldo >= 0 AND p_cor IS NOT NULL THEN
    INSERT INTO public.tecidos (nome, composicao, cor, cliente_id, estoque_kg, preco_kg, status)
    VALUES (
      p_nome,
      v_composicao,
      p_cor,
      p_cliente_id,
      v_saldo,
      0,
      CASE WHEN v_saldo > 0 THEN 'disponivel' ELSE 'indisponivel' END
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_tecido_entradas_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_tecido_estoque(OLD.cliente_id, OLD.nome_tecido, OLD.cor);
    RETURN OLD;
  END IF;

  -- INSERT ou UPDATE: recompute novo
  PERFORM public.recompute_tecido_estoque(NEW.cliente_id, NEW.nome_tecido, NEW.cor);

  -- Se UPDATE mudou chave lógica, recompute antiga também
  IF TG_OP = 'UPDATE' AND (
        OLD.cliente_id IS DISTINCT FROM NEW.cliente_id
     OR OLD.nome_tecido IS DISTINCT FROM NEW.nome_tecido
     OR COALESCE(OLD.cor,'') IS DISTINCT FROM COALESCE(NEW.cor,'')
  ) THEN
    PERFORM public.recompute_tecido_estoque(OLD.cliente_id, OLD.nome_tecido, OLD.cor);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tecido_entradas_sync ON public.tecido_entradas;
CREATE TRIGGER trg_tecido_entradas_sync
AFTER INSERT OR UPDATE OR DELETE ON public.tecido_entradas
FOR EACH ROW EXECUTE FUNCTION public.tg_tecido_entradas_sync();

-- Backfill: recompute para todas as combinações existentes em tecido_entradas
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT cliente_id, nome_tecido, cor
    FROM public.tecido_entradas
    WHERE cliente_id IS NOT NULL AND nome_tecido IS NOT NULL
  LOOP
    PERFORM public.recompute_tecido_estoque(r.cliente_id, r.nome_tecido, r.cor);
  END LOOP;
END $$;
