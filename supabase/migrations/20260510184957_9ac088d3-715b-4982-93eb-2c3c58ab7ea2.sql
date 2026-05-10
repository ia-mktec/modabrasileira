CREATE TABLE public.tecido_entradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid,
  cliente_nome text,
  nome_tecido text NOT NULL,
  composicao text,
  data_entrada date,
  cor text,
  qtde_rolos integer DEFAULT 0,
  unidade_medida text,
  metragem_total numeric DEFAULT 0,
  status text DEFAULT 'Disponível',
  ordem_corte1 text,
  ordem_corte2 text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tecido_entradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read tecido_entradas" ON public.tecido_entradas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert tecido_entradas" ON public.tecido_entradas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update tecido_entradas" ON public.tecido_entradas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete tecido_entradas" ON public.tecido_entradas FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_tecido_entradas_data ON public.tecido_entradas(data_entrada DESC);
CREATE INDEX idx_tecido_entradas_cliente ON public.tecido_entradas(cliente_id);