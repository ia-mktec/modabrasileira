CREATE TABLE public.tipos_modelo (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tipos_modelo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read tipos_modelo" ON public.tipos_modelo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert tipos_modelo" ON public.tipos_modelo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tipos_modelo" ON public.tipos_modelo FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete tipos_modelo" ON public.tipos_modelo FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_tipos_modelo_updated_at
BEFORE UPDATE ON public.tipos_modelo
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.tipos_modelo (nome) VALUES
  ('Calça'),('Shorts'),('Top'),('Saia'),('Vestido'),('Macacão'),
  ('Macaquinho'),('Blazer'),('Colete'),('Shorts-Saia'),('Camisa'),('Cropped')
ON CONFLICT (nome) DO NOTHING;