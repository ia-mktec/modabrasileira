DROP POLICY IF EXISTS "Modelos editors can insert modelos" ON public.modelos;
DROP POLICY IF EXISTS "Modelos editors can update modelos" ON public.modelos;
DROP POLICY IF EXISTS "Modelos editors can delete modelos" ON public.modelos;

CREATE POLICY "Modelos editors can insert modelos"
  ON public.modelos FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));
CREATE POLICY "Modelos editors can update modelos"
  ON public.modelos FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));
CREATE POLICY "Modelos editors can delete modelos"
  ON public.modelos FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));

DROP POLICY IF EXISTS "Modelos editors can insert modelo_aviamentos" ON public.modelo_aviamentos;
DROP POLICY IF EXISTS "Modelos editors can update modelo_aviamentos" ON public.modelo_aviamentos;
DROP POLICY IF EXISTS "Modelos editors can delete modelo_aviamentos" ON public.modelo_aviamentos;

CREATE POLICY "Modelos editors can insert modelo_aviamentos"
  ON public.modelo_aviamentos FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));
CREATE POLICY "Modelos editors can update modelo_aviamentos"
  ON public.modelo_aviamentos FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));
CREATE POLICY "Modelos editors can delete modelo_aviamentos"
  ON public.modelo_aviamentos FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));

DROP POLICY IF EXISTS "Modelos editors can insert modelo_gradacao" ON public.modelo_gradacao;
DROP POLICY IF EXISTS "Modelos editors can update modelo_gradacao" ON public.modelo_gradacao;
DROP POLICY IF EXISTS "Modelos editors can delete modelo_gradacao" ON public.modelo_gradacao;

CREATE POLICY "Modelos editors can insert modelo_gradacao"
  ON public.modelo_gradacao FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));
CREATE POLICY "Modelos editors can update modelo_gradacao"
  ON public.modelo_gradacao FOR UPDATE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']))
  WITH CHECK (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));
CREATE POLICY "Modelos editors can delete modelo_gradacao"
  ON public.modelo_gradacao FOR DELETE TO authenticated
  USING (public.can_edit_any_route(auth.uid(), ARRAY['/modelos', '/pedidos']));