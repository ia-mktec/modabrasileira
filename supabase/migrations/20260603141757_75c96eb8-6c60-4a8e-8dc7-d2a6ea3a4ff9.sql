CREATE TABLE IF NOT EXISTS public._oc_update_staging (
  numero text PRIMARY KEY,
  envio date,
  recebimento date,
  entrega date
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public._oc_update_staging TO authenticated;
GRANT ALL ON public._oc_update_staging TO service_role;
ALTER TABLE public._oc_update_staging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stage all" ON public._oc_update_staging FOR ALL TO authenticated USING (true) WITH CHECK (true);