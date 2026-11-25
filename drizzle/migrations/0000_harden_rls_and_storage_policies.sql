-- 1. Role & route-permission helper functions (SECURITY DEFINER, fixed search_path)
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_any_route(_user_id uuid, _routes text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'dev')
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.route_permissions rp ON rp.role = ur.role
      WHERE ur.user_id = _user_id
        AND rp.route = ANY(_routes)
        AND rp.permission IN ('view', 'edit')
    )
$$;

CREATE OR REPLACE FUNCTION public.can_edit_any_route(_user_id uuid, _routes text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'dev')
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.route_permissions rp ON rp.role = ur.role
      WHERE ur.user_id = _user_id
        AND rp.route = ANY(_routes)
        AND rp.permission = 'edit'
    )
$$;

REVOKE ALL ON FUNCTION public.has_any_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_access_any_route(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_any_route(uuid, text[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_edit_any_route(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_edit_any_route(uuid, text[]) TO authenticated, service_role;

-- 2. public.route_permissions (replace open SELECT with own-role or dev)
DROP POLICY IF EXISTS "Authenticated can read route_permissions" ON public.route_permissions;
CREATE POLICY "Role members can read relevant route_permissions"
  ON public.route_permissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'dev') OR public.has_role(auth.uid(), role));

-- 3. public.clientes
DROP POLICY IF EXISTS "Authenticated can read clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated can delete clientes" ON public.clientes;

CREATE POLICY "Assigned roles can read clientes"
  ON public.clientes FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Cadastro editors can insert clientes"
  ON public.clientes FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro']));
CREATE POLICY "Cadastro editors can update clientes"
  ON public.clientes FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro']));
CREATE POLICY "Cadastro editors can delete clientes"
  ON public.clientes FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro']));

-- 4. public.fornecedores
DROP POLICY IF EXISTS "Authenticated can read fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated can insert fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated can update fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated can delete fornecedores" ON public.fornecedores;

CREATE POLICY "Assigned roles can read fornecedores"
  ON public.fornecedores FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Cadastro editors can insert fornecedores"
  ON public.fornecedores FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro']));
CREATE POLICY "Cadastro editors can update fornecedores"
  ON public.fornecedores FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro']));
CREATE POLICY "Cadastro editors can delete fornecedores"
  ON public.fornecedores FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro']));

-- 5. public.cadastro_cores
DROP POLICY IF EXISTS "Authenticated can read cadastro_cores" ON public.cadastro_cores;
DROP POLICY IF EXISTS "Authenticated can insert cadastro_cores" ON public.cadastro_cores;
DROP POLICY IF EXISTS "Authenticated can update cadastro_cores" ON public.cadastro_cores;
DROP POLICY IF EXISTS "Authenticated can delete cadastro_cores" ON public.cadastro_cores;

CREATE POLICY "Assigned roles can read cadastro_cores"
  ON public.cadastro_cores FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Cadastro editors can insert cadastro_cores"
  ON public.cadastro_cores FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro', '/tecidos']));
CREATE POLICY "Cadastro editors can update cadastro_cores"
  ON public.cadastro_cores FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro', '/tecidos']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro', '/tecidos']));
CREATE POLICY "Cadastro editors can delete cadastro_cores"
  ON public.cadastro_cores FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro', '/tecidos']));

-- 6. public.tipos_modelo
DROP POLICY IF EXISTS "Authenticated can read tipos_modelo" ON public.tipos_modelo;
DROP POLICY IF EXISTS "Authenticated can insert tipos_modelo" ON public.tipos_modelo;
DROP POLICY IF EXISTS "Authenticated can update tipos_modelo" ON public.tipos_modelo;
DROP POLICY IF EXISTS "Authenticated can delete tipos_modelo" ON public.tipos_modelo;

CREATE POLICY "Assigned roles can read tipos_modelo"
  ON public.tipos_modelo FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Cadastro editors can insert tipos_modelo"
  ON public.tipos_modelo FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro', '/modelos']));
CREATE POLICY "Cadastro editors can update tipos_modelo"
  ON public.tipos_modelo FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro', '/modelos']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro', '/modelos']));
CREATE POLICY "Cadastro editors can delete tipos_modelo"
  ON public.tipos_modelo FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/cadastro', '/modelos']));

-- 7. public.aviamentos
DROP POLICY IF EXISTS "Authenticated can read aviamentos" ON public.aviamentos;
DROP POLICY IF EXISTS "Authenticated can insert aviamentos" ON public.aviamentos;
DROP POLICY IF EXISTS "Authenticated can update aviamentos" ON public.aviamentos;
DROP POLICY IF EXISTS "Authenticated can delete aviamentos" ON public.aviamentos;

CREATE POLICY "Assigned roles can read aviamentos"
  ON public.aviamentos FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Aviamentos editors can insert aviamentos"
  ON public.aviamentos FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/aviamentos', '/cadastro']));
CREATE POLICY "Aviamentos editors can update aviamentos"
  ON public.aviamentos FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/aviamentos', '/cadastro']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/aviamentos', '/cadastro']));
CREATE POLICY "Aviamentos editors can delete aviamentos"
  ON public.aviamentos FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/aviamentos', '/cadastro']));

-- 8. public.tecidos
DROP POLICY IF EXISTS "Authenticated can read tecidos" ON public.tecidos;
DROP POLICY IF EXISTS "Authenticated can insert tecidos" ON public.tecidos;
DROP POLICY IF EXISTS "Authenticated can update tecidos" ON public.tecidos;
DROP POLICY IF EXISTS "Authenticated can delete tecidos" ON public.tecidos;

CREATE POLICY "Assigned roles can read tecidos"
  ON public.tecidos FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Tecidos editors can insert tecidos"
  ON public.tecidos FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']));
CREATE POLICY "Tecidos editors can update tecidos"
  ON public.tecidos FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']));
CREATE POLICY "Tecidos editors can delete tecidos"
  ON public.tecidos FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']));

-- 9. public.tecido_entradas
DROP POLICY IF EXISTS "Auth read tecido_entradas" ON public.tecido_entradas;
DROP POLICY IF EXISTS "Auth insert tecido_entradas" ON public.tecido_entradas;
DROP POLICY IF EXISTS "Auth update tecido_entradas" ON public.tecido_entradas;
DROP POLICY IF EXISTS "Auth delete tecido_entradas" ON public.tecido_entradas;

CREATE POLICY "Assigned roles can read tecido_entradas"
  ON public.tecido_entradas FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Tecidos editors can insert tecido_entradas"
  ON public.tecido_entradas FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']));
CREATE POLICY "Tecidos editors can update tecido_entradas"
  ON public.tecido_entradas FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']));
CREATE POLICY "Tecidos editors can delete tecido_entradas"
  ON public.tecido_entradas FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']));

-- 10. public.estoque_movimentacoes
DROP POLICY IF EXISTS "Authenticated can read estoque_movimentacoes" ON public.estoque_movimentacoes;
DROP POLICY IF EXISTS "Authenticated can insert estoque_movimentacoes" ON public.estoque_movimentacoes;
DROP POLICY IF EXISTS "Authenticated can update estoque_movimentacoes" ON public.estoque_movimentacoes;
DROP POLICY IF EXISTS "Authenticated can delete estoque_movimentacoes" ON public.estoque_movimentacoes;

CREATE POLICY "Assigned roles can read estoque_movimentacoes"
  ON public.estoque_movimentacoes FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Tecidos editors can insert estoque_movimentacoes"
  ON public.estoque_movimentacoes FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']));
CREATE POLICY "Tecidos editors can update estoque_movimentacoes"
  ON public.estoque_movimentacoes FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']));
CREATE POLICY "Tecidos editors can delete estoque_movimentacoes"
  ON public.estoque_movimentacoes FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/tecidos', '/estoque-tecidos', '/corte']));

-- 11. public.modelos
DROP POLICY IF EXISTS "Authenticated can read modelos" ON public.modelos;
DROP POLICY IF EXISTS "Authenticated can insert modelos" ON public.modelos;
DROP POLICY IF EXISTS "Authenticated can update modelos" ON public.modelos;
DROP POLICY IF EXISTS "Authenticated can delete modelos" ON public.modelos;

CREATE POLICY "Assigned roles can read modelos"
  ON public.modelos FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Modelos editors can insert modelos"
  ON public.modelos FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']));
CREATE POLICY "Modelos editors can update modelos"
  ON public.modelos FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']));
CREATE POLICY "Modelos editors can delete modelos"
  ON public.modelos FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']));

-- 12. public.modelo_aviamentos
DROP POLICY IF EXISTS "Auth read modelo_aviamentos" ON public.modelo_aviamentos;
DROP POLICY IF EXISTS "Auth insert modelo_aviamentos" ON public.modelo_aviamentos;
DROP POLICY IF EXISTS "Auth update modelo_aviamentos" ON public.modelo_aviamentos;
DROP POLICY IF EXISTS "Auth delete modelo_aviamentos" ON public.modelo_aviamentos;

CREATE POLICY "Assigned roles can read modelo_aviamentos"
  ON public.modelo_aviamentos FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Modelos editors can insert modelo_aviamentos"
  ON public.modelo_aviamentos FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']));
CREATE POLICY "Modelos editors can update modelo_aviamentos"
  ON public.modelo_aviamentos FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']));
CREATE POLICY "Modelos editors can delete modelo_aviamentos"
  ON public.modelo_aviamentos FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']));

-- 13. public.modelo_gradacao
DROP POLICY IF EXISTS "Auth read modelo_gradacao" ON public.modelo_gradacao;
DROP POLICY IF EXISTS "Auth insert modelo_gradacao" ON public.modelo_gradacao;
DROP POLICY IF EXISTS "Auth update modelo_gradacao" ON public.modelo_gradacao;
DROP POLICY IF EXISTS "Auth delete modelo_gradacao" ON public.modelo_gradacao;

CREATE POLICY "Assigned roles can read modelo_gradacao"
  ON public.modelo_gradacao FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Modelos editors can insert modelo_gradacao"
  ON public.modelo_gradacao FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']));
CREATE POLICY "Modelos editors can update modelo_gradacao"
  ON public.modelo_gradacao FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']));
CREATE POLICY "Modelos editors can delete modelo_gradacao"
  ON public.modelo_gradacao FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos']));

-- 14. public.modelo_pedidos
DROP POLICY IF EXISTS "Authenticated can read modelo_pedidos" ON public.modelo_pedidos;
DROP POLICY IF EXISTS "Authenticated can insert modelo_pedidos" ON public.modelo_pedidos;
DROP POLICY IF EXISTS "Authenticated can update modelo_pedidos" ON public.modelo_pedidos;
DROP POLICY IF EXISTS "Authenticated can delete modelo_pedidos" ON public.modelo_pedidos;

CREATE POLICY "Assigned roles can read modelo_pedidos"
  ON public.modelo_pedidos FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Pedidos editors can insert modelo_pedidos"
  ON public.modelo_pedidos FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));
CREATE POLICY "Production editors can update modelo_pedidos"
  ON public.modelo_pedidos FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos', '/corte', '/expedicao', '/recebimento', '/entrega-cliente']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos', '/corte', '/expedicao', '/recebimento', '/entrega-cliente']));
CREATE POLICY "Pedidos editors can delete modelo_pedidos"
  ON public.modelo_pedidos FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));

-- 15. public.aviamentos_pedido
DROP POLICY IF EXISTS "Authenticated can read aviamentos_pedido" ON public.aviamentos_pedido;
DROP POLICY IF EXISTS "Authenticated can insert aviamentos_pedido" ON public.aviamentos_pedido;
DROP POLICY IF EXISTS "Authenticated can update aviamentos_pedido" ON public.aviamentos_pedido;
DROP POLICY IF EXISTS "Authenticated can delete aviamentos_pedido" ON public.aviamentos_pedido;

CREATE POLICY "Assigned roles can read aviamentos_pedido"
  ON public.aviamentos_pedido FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Pedidos editors can insert aviamentos_pedido"
  ON public.aviamentos_pedido FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));
CREATE POLICY "Pedidos or gestor editors can update aviamentos_pedido"
  ON public.aviamentos_pedido FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos', '/ficha-gestor']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos', '/ficha-gestor']));
CREATE POLICY "Pedidos editors can delete aviamentos_pedido"
  ON public.aviamentos_pedido FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));

-- 16. public.pedido_historico (populated by SECURITY DEFINER trigger)
DROP POLICY IF EXISTS "Authenticated can read pedido_historico" ON public.pedido_historico;
DROP POLICY IF EXISTS "Authenticated can insert pedido_historico" ON public.pedido_historico;

CREATE POLICY "Assigned roles can read pedido_historico"
  ON public.pedido_historico FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Dev can insert pedido_historico"
  ON public.pedido_historico FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'dev'));

-- 17. public.ordens_corte
DROP POLICY IF EXISTS "Authenticated can read ordens_corte" ON public.ordens_corte;
DROP POLICY IF EXISTS "Authenticated can insert ordens_corte" ON public.ordens_corte;
DROP POLICY IF EXISTS "Authenticated can update ordens_corte" ON public.ordens_corte;
DROP POLICY IF EXISTS "Authenticated can delete ordens_corte" ON public.ordens_corte;

CREATE POLICY "Assigned roles can read ordens_corte"
  ON public.ordens_corte FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Corte editors can insert ordens_corte"
  ON public.ordens_corte FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/corte']));
CREATE POLICY "Corte editors can update ordens_corte"
  ON public.ordens_corte FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/corte']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/corte']));
CREATE POLICY "Corte editors can delete ordens_corte"
  ON public.ordens_corte FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/corte']));

-- 18. public.grade_corte
DROP POLICY IF EXISTS "Authenticated can read grade_corte" ON public.grade_corte;
DROP POLICY IF EXISTS "Authenticated can insert grade_corte" ON public.grade_corte;
DROP POLICY IF EXISTS "Authenticated can update grade_corte" ON public.grade_corte;
DROP POLICY IF EXISTS "Authenticated can delete grade_corte" ON public.grade_corte;

CREATE POLICY "Assigned roles can read grade_corte"
  ON public.grade_corte FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Corte editors can insert grade_corte"
  ON public.grade_corte FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/corte']));
CREATE POLICY "Corte editors can update grade_corte"
  ON public.grade_corte FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/corte']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/corte']));
CREATE POLICY "Corte editors can delete grade_corte"
  ON public.grade_corte FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/corte']));

-- 19. public.aviamentos_ordem
DROP POLICY IF EXISTS "Authenticated can read aviamentos_ordem" ON public.aviamentos_ordem;
DROP POLICY IF EXISTS "Authenticated can insert aviamentos_ordem" ON public.aviamentos_ordem;
DROP POLICY IF EXISTS "Authenticated can update aviamentos_ordem" ON public.aviamentos_ordem;
DROP POLICY IF EXISTS "Authenticated can delete aviamentos_ordem" ON public.aviamentos_ordem;

CREATE POLICY "Assigned roles can read aviamentos_ordem"
  ON public.aviamentos_ordem FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Corte editors can insert aviamentos_ordem"
  ON public.aviamentos_ordem FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/corte']));
CREATE POLICY "Corte editors can update aviamentos_ordem"
  ON public.aviamentos_ordem FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/corte']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/corte']));
CREATE POLICY "Corte editors can delete aviamentos_ordem"
  ON public.aviamentos_ordem FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/corte']));

-- 20. public.expedicao
DROP POLICY IF EXISTS "Authenticated can read expedicao" ON public.expedicao;
DROP POLICY IF EXISTS "Authenticated can insert expedicao" ON public.expedicao;
DROP POLICY IF EXISTS "Authenticated can update expedicao" ON public.expedicao;
DROP POLICY IF EXISTS "Authenticated can delete expedicao" ON public.expedicao;

CREATE POLICY "Assigned roles can read expedicao"
  ON public.expedicao FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Expedicao editors can insert expedicao"
  ON public.expedicao FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/expedicao']));
CREATE POLICY "Expedicao editors can update expedicao"
  ON public.expedicao FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/expedicao']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/expedicao']));
CREATE POLICY "Expedicao editors can delete expedicao"
  ON public.expedicao FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/expedicao']));

-- 21. public.grade_expedicao
DROP POLICY IF EXISTS "Authenticated can read grade_expedicao" ON public.grade_expedicao;
DROP POLICY IF EXISTS "Authenticated can insert grade_expedicao" ON public.grade_expedicao;
DROP POLICY IF EXISTS "Authenticated can update grade_expedicao" ON public.grade_expedicao;
DROP POLICY IF EXISTS "Authenticated can delete grade_expedicao" ON public.grade_expedicao;

CREATE POLICY "Assigned roles can read grade_expedicao"
  ON public.grade_expedicao FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Expedicao editors can insert grade_expedicao"
  ON public.grade_expedicao FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/expedicao']));
CREATE POLICY "Expedicao editors can update grade_expedicao"
  ON public.grade_expedicao FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/expedicao']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/expedicao']));
CREATE POLICY "Expedicao editors can delete grade_expedicao"
  ON public.grade_expedicao FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/expedicao']));

-- 22. public.recebimento
DROP POLICY IF EXISTS "Authenticated can read recebimento" ON public.recebimento;
DROP POLICY IF EXISTS "Authenticated can insert recebimento" ON public.recebimento;
DROP POLICY IF EXISTS "Authenticated can update recebimento" ON public.recebimento;
DROP POLICY IF EXISTS "Authenticated can delete recebimento" ON public.recebimento;

CREATE POLICY "Assigned roles can read recebimento"
  ON public.recebimento FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Recebimento or expedicao editors can insert recebimento"
  ON public.recebimento FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/recebimento', '/expedicao']));
CREATE POLICY "Recebimento or expedicao editors can update recebimento"
  ON public.recebimento FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/recebimento', '/expedicao']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/recebimento', '/expedicao']));
CREATE POLICY "Recebimento editors can delete recebimento"
  ON public.recebimento FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/recebimento']));

-- 23. public.entrega_cliente
DROP POLICY IF EXISTS "Authenticated can read entrega_cliente" ON public.entrega_cliente;
DROP POLICY IF EXISTS "Authenticated can insert entrega_cliente" ON public.entrega_cliente;
DROP POLICY IF EXISTS "Authenticated can update entrega_cliente" ON public.entrega_cliente;
DROP POLICY IF EXISTS "Authenticated can delete entrega_cliente" ON public.entrega_cliente;

CREATE POLICY "Assigned roles can read entrega_cliente"
  ON public.entrega_cliente FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));
CREATE POLICY "Entrega editors can insert entrega_cliente"
  ON public.entrega_cliente FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/entrega-cliente']));
CREATE POLICY "Entrega editors can update entrega_cliente"
  ON public.entrega_cliente FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/entrega-cliente']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/entrega-cliente']));
CREATE POLICY "Entrega editors can delete entrega_cliente"
  ON public.entrega_cliente FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/entrega-cliente']));

-- 24. public.ficha_gestor_custos
DROP POLICY IF EXISTS "Authenticated can read ficha_gestor_custos" ON public.ficha_gestor_custos;
DROP POLICY IF EXISTS "Authenticated can insert ficha_gestor_custos" ON public.ficha_gestor_custos;
DROP POLICY IF EXISTS "Authenticated can update ficha_gestor_custos" ON public.ficha_gestor_custos;
DROP POLICY IF EXISTS "Authenticated can delete ficha_gestor_custos" ON public.ficha_gestor_custos;

CREATE POLICY "Gestor viewers can read ficha_gestor_custos"
  ON public.ficha_gestor_custos FOR SELECT TO authenticated
  USING (public.can_access_any_route(auth.uid(), ARRAY['/ficha-gestor', '/cash-flow']));
CREATE POLICY "Gestor editors can insert ficha_gestor_custos"
  ON public.ficha_gestor_custos FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/ficha-gestor']));
CREATE POLICY "Gestor editors can update ficha_gestor_custos"
  ON public.ficha_gestor_custos FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/ficha-gestor']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/ficha-gestor']));
CREATE POLICY "Gestor editors can delete ficha_gestor_custos"
  ON public.ficha_gestor_custos FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/ficha-gestor']));

-- 25. storage.objects write policies for modelos and produtos buckets (leave SELECT policies untouched)
DROP POLICY IF EXISTS "Auth upload modelos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Auth update modelos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete modelos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete product images" ON storage.objects;

CREATE POLICY "Auth upload modelos bucket"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'modelos'
    AND owner_id = (SELECT auth.uid()::text)
    AND public.can_edit_any_route(auth.uid(), ARRAY['/modelos'])
  );

CREATE POLICY "Auth update modelos bucket"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'modelos'
    AND owner_id = (SELECT auth.uid()::text)
    AND public.can_edit_any_route(auth.uid(), ARRAY['/modelos'])
  )
  WITH CHECK (
    bucket_id = 'modelos'
    AND owner_id = (SELECT auth.uid()::text)
    AND public.can_edit_any_route(auth.uid(), ARRAY['/modelos'])
  );

CREATE POLICY "Auth delete modelos bucket"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'modelos'
    AND owner_id = (SELECT auth.uid()::text)
    AND public.can_edit_any_route(auth.uid(), ARRAY['/modelos'])
  );

CREATE POLICY "Auth users can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'produtos'
    AND owner_id = (SELECT auth.uid()::text)
    AND public.can_edit_any_route(auth.uid(), ARRAY['/modelos'])
  );

CREATE POLICY "Auth users can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'produtos'
    AND owner_id = (SELECT auth.uid()::text)
    AND public.can_edit_any_route(auth.uid(), ARRAY['/modelos'])
  )
  WITH CHECK (
    bucket_id = 'produtos'
    AND owner_id = (SELECT auth.uid()::text)
    AND public.can_edit_any_route(auth.uid(), ARRAY['/modelos'])
  );

CREATE POLICY "Auth users can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'produtos'
    AND owner_id = (SELECT auth.uid()::text)
    AND public.can_edit_any_route(auth.uid(), ARRAY['/modelos'])
  );