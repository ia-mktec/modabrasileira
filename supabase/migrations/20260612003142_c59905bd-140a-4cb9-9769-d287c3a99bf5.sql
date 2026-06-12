CREATE TABLE public.ficha_gestor_custos (
  ordem_corte_id uuid PRIMARY KEY REFERENCES public.ordens_corte(id) ON DELETE CASCADE,
  numero_pedido text NOT NULL,
  custo_entretelagem numeric(10,2) NOT NULL DEFAULT 0,
  custo_acabamento numeric(10,2) NOT NULL DEFAULT 0,
  custo_tecido_servico numeric(10,2) NOT NULL DEFAULT 0,
  preco_venda numeric(10,2) NOT NULL DEFAULT 0,
  comissao_percent numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_ficha_gestor_custos_pedido ON public.ficha_gestor_custos(numero_pedido);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ficha_gestor_custos TO authenticated;
GRANT ALL ON public.ficha_gestor_custos TO service_role;

ALTER TABLE public.ficha_gestor_custos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read ficha_gestor_custos"
  ON public.ficha_gestor_custos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ficha_gestor_custos"
  ON public.ficha_gestor_custos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ficha_gestor_custos"
  ON public.ficha_gestor_custos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete ficha_gestor_custos"
  ON public.ficha_gestor_custos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_ficha_gestor_custos_updated_at
  BEFORE UPDATE ON public.ficha_gestor_custos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();