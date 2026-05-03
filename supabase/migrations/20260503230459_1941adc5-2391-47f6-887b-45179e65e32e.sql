
-- Fase 1: nova tabela de pedidos de modelo + ajustes em ordens_corte

CREATE TABLE IF NOT EXISTS public.modelo_pedidos (
  numero_pedido text PRIMARY KEY,
  cliente text,
  modelo_ref text NOT NULL,
  data_pedido date NOT NULL DEFAULT CURRENT_DATE,
  tecido text,
  cor text,
  consumo_tecido numeric DEFAULT 0,
  observacoes text,
  status_kanban text NOT NULL DEFAULT 'pendente',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.modelo_pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read modelo_pedidos"
  ON public.modelo_pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert modelo_pedidos"
  ON public.modelo_pedidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update modelo_pedidos"
  ON public.modelo_pedidos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete modelo_pedidos"
  ON public.modelo_pedidos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_modelo_pedidos_updated_at
  BEFORE UPDATE ON public.modelo_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_modelo_pedidos_modelo_ref ON public.modelo_pedidos(modelo_ref);
CREATE INDEX IF NOT EXISTS idx_modelo_pedidos_status ON public.modelo_pedidos(status_kanban);

-- Permitir busca por numero_pedido no módulo Corte
ALTER TABLE public.ordens_corte
  ADD COLUMN IF NOT EXISTS numero_pedido text;

CREATE INDEX IF NOT EXISTS idx_ordens_corte_numero_pedido ON public.ordens_corte(numero_pedido);
