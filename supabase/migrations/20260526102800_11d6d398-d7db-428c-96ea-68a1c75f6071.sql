-- Expande pedido_historico para auditar todos os campos do pedido
ALTER TABLE public.pedido_historico
  ADD COLUMN IF NOT EXISTS campo text,
  ADD COLUMN IF NOT EXISTS valor_anterior text,
  ADD COLUMN IF NOT EXISTS valor_novo text;

ALTER TABLE public.pedido_historico ALTER COLUMN status_novo DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pedido_historico_numero_created
  ON public.pedido_historico(numero_pedido, created_at DESC);

-- Substitui o trigger antigo que só monitorava status_kanban
CREATE OR REPLACE FUNCTION public.log_pedido_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pedido_historico
      (numero_pedido, modelo_ref, status_anterior, status_novo, changed_by, campo, valor_anterior, valor_novo)
    VALUES
      (NEW.numero_pedido, NEW.modelo_ref, NULL, NEW.status_kanban, uid, 'criacao', NULL, 'Pedido criado');
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status_kanban IS DISTINCT FROM NEW.status_kanban THEN
      INSERT INTO public.pedido_historico(numero_pedido, modelo_ref, status_anterior, status_novo, changed_by, campo, valor_anterior, valor_novo)
      VALUES (NEW.numero_pedido, NEW.modelo_ref, OLD.status_kanban, NEW.status_kanban, uid, 'status_kanban', OLD.status_kanban, NEW.status_kanban);
    END IF;
    IF OLD.modelo_ref IS DISTINCT FROM NEW.modelo_ref THEN
      INSERT INTO public.pedido_historico(numero_pedido, modelo_ref, changed_by, campo, valor_anterior, valor_novo, status_novo)
      VALUES (NEW.numero_pedido, NEW.modelo_ref, uid, 'modelo_ref', OLD.modelo_ref, NEW.modelo_ref, NEW.status_kanban);
    END IF;
    IF COALESCE(OLD.cliente,'') IS DISTINCT FROM COALESCE(NEW.cliente,'') THEN
      INSERT INTO public.pedido_historico(numero_pedido, modelo_ref, changed_by, campo, valor_anterior, valor_novo, status_novo)
      VALUES (NEW.numero_pedido, NEW.modelo_ref, uid, 'cliente', OLD.cliente, NEW.cliente, NEW.status_kanban);
    END IF;
    IF COALESCE(OLD.tecido,'') IS DISTINCT FROM COALESCE(NEW.tecido,'') THEN
      INSERT INTO public.pedido_historico(numero_pedido, modelo_ref, changed_by, campo, valor_anterior, valor_novo, status_novo)
      VALUES (NEW.numero_pedido, NEW.modelo_ref, uid, 'tecido', OLD.tecido, NEW.tecido, NEW.status_kanban);
    END IF;
    IF COALESCE(OLD.cor,'') IS DISTINCT FROM COALESCE(NEW.cor,'') THEN
      INSERT INTO public.pedido_historico(numero_pedido, modelo_ref, changed_by, campo, valor_anterior, valor_novo, status_novo)
      VALUES (NEW.numero_pedido, NEW.modelo_ref, uid, 'cor', OLD.cor, NEW.cor, NEW.status_kanban);
    END IF;
    IF OLD.data_pedido IS DISTINCT FROM NEW.data_pedido THEN
      INSERT INTO public.pedido_historico(numero_pedido, modelo_ref, changed_by, campo, valor_anterior, valor_novo, status_novo)
      VALUES (NEW.numero_pedido, NEW.modelo_ref, uid, 'data_pedido', OLD.data_pedido::text, NEW.data_pedido::text, NEW.status_kanban);
    END IF;
    IF COALESCE(OLD.piloto_entregue, false) IS DISTINCT FROM COALESCE(NEW.piloto_entregue, false) THEN
      INSERT INTO public.pedido_historico(numero_pedido, modelo_ref, changed_by, campo, valor_anterior, valor_novo, status_novo)
      VALUES (NEW.numero_pedido, NEW.modelo_ref, uid, 'piloto_entregue', OLD.piloto_entregue::text, NEW.piloto_entregue::text, NEW.status_kanban);
    END IF;
    IF COALESCE(OLD.consumo_tecido, 0) IS DISTINCT FROM COALESCE(NEW.consumo_tecido, 0) THEN
      INSERT INTO public.pedido_historico(numero_pedido, modelo_ref, changed_by, campo, valor_anterior, valor_novo, status_novo)
      VALUES (NEW.numero_pedido, NEW.modelo_ref, uid, 'consumo_tecido', OLD.consumo_tecido::text, NEW.consumo_tecido::text, NEW.status_kanban);
    END IF;
    IF COALESCE(OLD.observacoes,'') IS DISTINCT FROM COALESCE(NEW.observacoes,'') THEN
      INSERT INTO public.pedido_historico(numero_pedido, modelo_ref, changed_by, campo, valor_anterior, valor_novo, status_novo)
      VALUES (NEW.numero_pedido, NEW.modelo_ref, uid, 'observacoes', OLD.observacoes, NEW.observacoes, NEW.status_kanban);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_log_pedido_status_change ON public.modelo_pedidos;
DROP TRIGGER IF EXISTS log_pedido_status_change_trigger ON public.modelo_pedidos;
DROP TRIGGER IF EXISTS log_pedido_changes_trigger ON public.modelo_pedidos;

CREATE TRIGGER log_pedido_changes_trigger
AFTER INSERT OR UPDATE ON public.modelo_pedidos
FOR EACH ROW EXECUTE FUNCTION public.log_pedido_status_change();