
CREATE TABLE public.route_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route text NOT NULL,
  role app_role NOT NULL,
  permission text NOT NULL CHECK (permission IN ('edit','view')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (route, role)
);

ALTER TABLE public.route_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read route_permissions"
ON public.route_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Dev can insert route_permissions"
ON public.route_permissions FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'dev'::app_role));

CREATE POLICY "Dev can update route_permissions"
ON public.route_permissions FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'dev'::app_role));

CREATE POLICY "Dev can delete route_permissions"
ON public.route_permissions FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'dev'::app_role));

CREATE TRIGGER trg_route_permissions_updated
BEFORE UPDATE ON public.route_permissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.route_permissions (route, role, permission) VALUES
('/', 'corte', 'view'),('/', 'modelagem', 'view'),('/', 'gestao', 'view'),('/', 'dev', 'edit'),
('/tecidos', 'corte', 'edit'),('/tecidos', 'dev', 'edit'),
('/estoque-tecidos', 'corte', 'edit'),('/estoque-tecidos', 'gestao', 'view'),('/estoque-tecidos', 'dev', 'edit'),
('/modelos', 'corte', 'view'),('/modelos', 'modelagem', 'edit'),('/modelos', 'expedicao', 'edit'),('/modelos', 'gestao', 'view'),('/modelos', 'dev', 'edit'),
('/pedidos', 'corte', 'view'),('/pedidos', 'modelagem', 'view'),('/pedidos', 'expedicao', 'view'),('/pedidos', 'recebimento', 'view'),('/pedidos', 'acabamento', 'view'),('/pedidos', 'gestao', 'view'),('/pedidos', 'dev', 'edit'),
('/corte', 'corte', 'edit'),('/corte', 'modelagem', 'view'),('/corte', 'expedicao', 'view'),('/corte', 'recebimento', 'view'),('/corte', 'dev', 'edit'),
('/cadastro', 'corte', 'edit'),('/cadastro', 'modelagem', 'edit'),('/cadastro', 'expedicao', 'edit'),('/cadastro', 'gestao', 'edit'),('/cadastro', 'dev', 'edit'),
('/aviamentos', 'corte', 'edit'),('/aviamentos', 'modelagem', 'edit'),('/aviamentos', 'expedicao', 'edit'),('/aviamentos', 'gestao', 'edit'),('/aviamentos', 'dev', 'edit'),
('/expedicao', 'expedicao', 'edit'),('/expedicao', 'recebimento', 'view'),('/expedicao', 'gestao', 'edit'),('/expedicao', 'dev', 'edit'),
('/recebimento', 'recebimento', 'edit'),('/recebimento', 'acabamento', 'view'),('/recebimento', 'dev', 'edit'),
('/entrega-cliente', 'acabamento', 'edit'),('/entrega-cliente', 'dev', 'edit'),
('/relatorio-clientes', 'gestao', 'view'),('/relatorio-clientes', 'dev', 'edit'),
('/relatorio-producao', 'corte', 'view'),('/relatorio-producao', 'modelagem', 'view'),('/relatorio-producao', 'expedicao', 'view'),('/relatorio-producao', 'recebimento', 'view'),('/relatorio-producao', 'acabamento', 'view'),('/relatorio-producao', 'gestao', 'view'),('/relatorio-producao', 'dev', 'edit'),
('/cash-flow', 'gestao', 'view'),('/cash-flow', 'dev', 'edit'),
('/ficha-ziper', 'dev', 'edit'),
('/gerenciar-usuarios', 'dev', 'edit')
ON CONFLICT (route, role) DO NOTHING;
