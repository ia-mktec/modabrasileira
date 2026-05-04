
-- ===== MODELOS: novos campos =====
ALTER TABLE public.modelos
  ADD COLUMN IF NOT EXISTS modelo TEXT,
  ADD COLUMN IF NOT EXISTS consumo_metros NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consumo_gramas NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entretela BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS entretela_descricao TEXT,
  ADD COLUMN IF NOT EXISTS entretela_quantidade NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forro_tecido2 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS forro_tecido2_descricao TEXT,
  ADD COLUMN IF NOT EXISTS forro_tecido2_quantidade NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS arquivo_modelagem_url TEXT;

-- UNIQUE em referencia (idempotente)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modelos_referencia_unique'
  ) THEN
    ALTER TABLE public.modelos ADD CONSTRAINT modelos_referencia_unique UNIQUE (referencia);
  END IF;
END $$;

-- ===== MODELO_PEDIDOS: piloto_entregue =====
ALTER TABLE public.modelo_pedidos
  ADD COLUMN IF NOT EXISTS piloto_entregue BOOLEAN DEFAULT false;

-- ===== MODELO_AVIAMENTOS =====
CREATE TABLE IF NOT EXISTS public.modelo_aviamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  descricao TEXT,
  quantidade NUMERIC DEFAULT 0,
  unidade TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_modelo_aviamentos_modelo ON public.modelo_aviamentos(modelo_id);
ALTER TABLE public.modelo_aviamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read modelo_aviamentos" ON public.modelo_aviamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert modelo_aviamentos" ON public.modelo_aviamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update modelo_aviamentos" ON public.modelo_aviamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete modelo_aviamentos" ON public.modelo_aviamentos FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_modelo_aviamentos_updated BEFORE UPDATE ON public.modelo_aviamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== MODELO_SERVICOS =====
CREATE TABLE IF NOT EXISTS public.modelo_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  descricao TEXT,
  valor_unitario NUMERIC DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_modelo_servicos_modelo ON public.modelo_servicos(modelo_id);
ALTER TABLE public.modelo_servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read modelo_servicos" ON public.modelo_servicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert modelo_servicos" ON public.modelo_servicos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update modelo_servicos" ON public.modelo_servicos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete modelo_servicos" ON public.modelo_servicos FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_modelo_servicos_updated BEFORE UPDATE ON public.modelo_servicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== MODELO_GRADACAO =====
CREATE TABLE IF NOT EXISTS public.modelo_gradacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  tamanho TEXT,
  medida_a NUMERIC DEFAULT 0,
  medida_b NUMERIC DEFAULT 0,
  medida_c NUMERIC DEFAULT 0,
  medida_d NUMERIC DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_modelo_gradacao_modelo ON public.modelo_gradacao(modelo_id);
ALTER TABLE public.modelo_gradacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read modelo_gradacao" ON public.modelo_gradacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert modelo_gradacao" ON public.modelo_gradacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update modelo_gradacao" ON public.modelo_gradacao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete modelo_gradacao" ON public.modelo_gradacao FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_modelo_gradacao_updated BEFORE UPDATE ON public.modelo_gradacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== STORAGE BUCKET: modelos =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('modelos', 'modelos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read modelos bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'modelos');
CREATE POLICY "Auth upload modelos bucket" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'modelos');
CREATE POLICY "Auth update modelos bucket" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'modelos');
CREATE POLICY "Auth delete modelos bucket" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'modelos');
