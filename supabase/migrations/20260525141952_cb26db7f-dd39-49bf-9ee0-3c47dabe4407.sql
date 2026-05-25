CREATE TABLE IF NOT EXISTS public.pedido_numero_controle (
  id integer PRIMARY KEY DEFAULT 1,
  ultimo_numero integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pedido_numero_controle_singleton CHECK (id = 1)
);

ALTER TABLE public.pedido_numero_controle ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.proximo_numero_pedido()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  maior_existente integer := 0;
  proximo integer;
BEGIN
  PERFORM pg_advisory_xact_lock(5408474, 1);

  SELECT COALESCE(MAX((regexp_match(numero_pedido, '^PED-([0-9]+)$'))[1]::integer), 0)
  INTO maior_existente
  FROM public.modelo_pedidos
  WHERE numero_pedido ~ '^PED-[0-9]+$';

  INSERT INTO public.pedido_numero_controle (id, ultimo_numero)
  VALUES (1, maior_existente)
  ON CONFLICT (id) DO UPDATE
  SET ultimo_numero = GREATEST(public.pedido_numero_controle.ultimo_numero, EXCLUDED.ultimo_numero),
      updated_at = now();

  UPDATE public.pedido_numero_controle
  SET ultimo_numero = ultimo_numero + 1,
      updated_at = now()
  WHERE id = 1
  RETURNING ultimo_numero INTO proximo;

  RETURN 'PED-' || lpad(proximo::text, 5, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.proximo_numero_pedido() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.proximo_numero_pedido() TO authenticated;