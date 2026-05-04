CREATE TABLE public.aviamentos_pedido (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido TEXT NOT NULL,
  modelo_ref TEXT,
  tipo TEXT,
  descricao_item TEXT,
  tamanho TEXT,
  cor TEXT,
  preco_unitario NUMERIC DEFAULT 0,
  partes_qtde NUMERIC DEFAULT 0,
  qtde_total_pedido NUMERIC DEFAULT 0,
  fornecedor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aviamentos_pedido_numero ON public.aviamentos_pedido(numero_pedido);
CREATE INDEX idx_aviamentos_pedido_modelo_ref ON public.aviamentos_pedido(modelo_ref);

ALTER TABLE public.aviamentos_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read aviamentos_pedido"
  ON public.aviamentos_pedido FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert aviamentos_pedido"
  ON public.aviamentos_pedido FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update aviamentos_pedido"
  ON public.aviamentos_pedido FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete aviamentos_pedido"
  ON public.aviamentos_pedido FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_aviamentos_pedido_updated_at
  BEFORE UPDATE ON public.aviamentos_pedido
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();