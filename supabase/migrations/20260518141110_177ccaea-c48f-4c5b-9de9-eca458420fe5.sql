ALTER TABLE public.modelos
  ADD COLUMN IF NOT EXISTS entretela_consumo_peca numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forro_tecido2_consumo_peca numeric DEFAULT 0;