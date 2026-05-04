-- Tabela de histórico de transições do pedido
CREATE TABLE public.pedido_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido TEXT NOT NULL,
  modelo_ref TEXT,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  changed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_pedido_historico_numero ON public.pedido_historico(numero_pedido);
CREATE INDEX idx_pedido_historico_created ON public.pedido_historico(created_at DESC);

ALTER TABLE public.pedido_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read pedido_historico"
  ON public.pedido_historico FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert pedido_historico"
  ON public.pedido_historico FOR INSERT TO authenticated WITH CHECK (true);

-- Função e trigger para registrar transições automaticamente
CREATE OR REPLACE FUNCTION public.log_pedido_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.pedido_historico (numero_pedido, modelo_ref, status_anterior, status_novo, changed_by)
    VALUES (NEW.numero_pedido, NEW.modelo_ref, NULL, NEW.status_kanban, auth.uid());
  ELSIF (TG_OP = 'UPDATE') AND (OLD.status_kanban IS DISTINCT FROM NEW.status_kanban) THEN
    INSERT INTO public.pedido_historico (numero_pedido, modelo_ref, status_anterior, status_novo, changed_by)
    VALUES (NEW.numero_pedido, NEW.modelo_ref, OLD.status_kanban, NEW.status_kanban, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pedido_status_change
AFTER INSERT OR UPDATE ON public.modelo_pedidos
FOR EACH ROW EXECUTE FUNCTION public.log_pedido_status_change();