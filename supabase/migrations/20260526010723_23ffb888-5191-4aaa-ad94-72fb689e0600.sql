ALTER TABLE public.modelos
  ADD COLUMN IF NOT EXISTS qtde_rolos integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corte text,
  ADD COLUMN IF NOT EXISTS foto_cliente_1_url text,
  ADD COLUMN IF NOT EXISTS foto_cliente_2_url text;