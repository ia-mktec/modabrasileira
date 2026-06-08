
CREATE TABLE public.cadastro_cores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cor text NOT NULL UNIQUE,
  cod text NOT NULL UNIQUE,
  hex text NOT NULL DEFAULT '#ffffff',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cadastro_cores TO authenticated;
GRANT ALL ON public.cadastro_cores TO service_role;

ALTER TABLE public.cadastro_cores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read cadastro_cores"
  ON public.cadastro_cores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert cadastro_cores"
  ON public.cadastro_cores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update cadastro_cores"
  ON public.cadastro_cores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete cadastro_cores"
  ON public.cadastro_cores FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_cadastro_cores_updated
  BEFORE UPDATE ON public.cadastro_cores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.cadastro_cores (cor, cod, hex) VALUES
  ('Abacate','001','#7a9a3b'),('Abóbora','002','#e67e22'),('Amarelo','003','#ffeb3b'),
  ('Areia','004','#c2b280'),('Azul','005','#0000cd'),('Azul bebê','006','#a7c7e7'),
  ('Azul céu','007','#87ceeb'),('Azul claro','008','#5dade2'),('Azul escuro','009','#1a237e'),
  ('Azul jeans','010','#5e7e9a'),('Azul pastel','011','#aec6cf'),('Bege','012','#e8d3b0'),
  ('Bege escuro','013','#a98765'),('Bordô','014','#7b1c30'),('Branco','015','#ffffff'),
  ('Café','016','#4b2e1e'),('Cappuccino','017','#a67b5b'),('Caqui','018','#c3b091'),
  ('Caramelo','019','#af6e4d'),('Chocolate','020','#5d3a1a'),('Chumbo','021','#36454f'),
  ('Cinza','022','#808080'),('Cinza claro','023','#d3d3d3'),('Cobre','024','#b87333'),
  ('Creme','025','#fffdd0'),('Fúcsia','026','#ff00ff'),('Gelo','027','#f0f8ff'),
  ('Goiaba','028','#f08080'),('Laranja','029','#ff7f00'),('Lilás','030','#c8a2c8'),
  ('Limão','031','#bfff00'),('Marinho','032','#001f4d'),('Marrom','033','#654321'),
  ('Mostarda','034','#ffdb58'),('Musgo','035','#5a6e3a'),('Natural','036','#f5e9c8'),
  ('Nude','037','#f5cba7'),('Ocre','038','#cc7722'),('Off','039','#faf0e6'),
  ('Oliva','040','#808000'),('Palha','041','#e8d8a0'),('Pele','042','#f1c27d'),
  ('Petróleo','043','#1a4a5a'),('Pink','044','#ff1493'),('Prata','045','#c0c0c0'),
  ('Preto','046','#000000'),('Rosa','047','#ff69b4'),('Roxo','048','#800080'),
  ('Salmão','049','#fa8072'),('Taupe','050','#8b7d6b'),('Terra','051','#8b4513'),
  ('Toffee','052','#8b5a2b'),('Turquesa','053','#40e0d0'),('Verde','054','#228b22'),
  ('Verde água','055','#a8e6cf'),('Verde claro','056','#90ee90'),('Verde-mar','057','#2e8b57'),
  ('Vermelho','058','#dc143c'),('Vinho','059','#722f37'),('Pêssego','060','#ffcba4'),
  ('Diversos','061','#bdbdbd')
ON CONFLICT (cor) DO NOTHING;
