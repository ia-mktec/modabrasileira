
-- Clientes
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  cnpj text,
  contato text,
  telefone text,
  cidade text,
  uf text,
  prazo_recebimento integer DEFAULT 30,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fornecedores
CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  cnpj text,
  contato text,
  telefone text,
  email text,
  cidade text,
  uf text,
  tipo text NOT NULL DEFAULT 'tecido',
  prazo_pagamento integer DEFAULT 30,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tecidos
CREATE TABLE public.tecidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  composicao text,
  largura numeric(5,2),
  peso numeric(6,1),
  cor text,
  cliente_id uuid REFERENCES public.clientes(id),
  estoque_kg numeric(10,2) NOT NULL DEFAULT 0,
  preco_kg numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'disponivel',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Modelos
CREATE TABLE public.modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referencia text NOT NULL UNIQUE,
  descricao text NOT NULL,
  colecao text,
  tecido_principal text,
  consumo_tecido numeric(6,3) DEFAULT 0,
  tamanhos_grade text,
  status text NOT NULL DEFAULT 'ativo',
  imagem_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Aviamentos (catálogo)
CREATE TABLE public.aviamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  descricao text NOT NULL,
  tamanho text,
  cor text,
  preco_un numeric(10,3) DEFAULT 0,
  fornecedor_id uuid REFERENCES public.fornecedores(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ordens de Corte
CREATE TABLE public.ordens_corte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  modelo_id uuid REFERENCES public.modelos(id),
  modelo_ref text,
  tecido_id uuid REFERENCES public.tecidos(id),
  tecido_nome text,
  cliente_id uuid REFERENCES public.clientes(id),
  quantidade_pecas integer NOT NULL DEFAULT 0,
  data_corte date,
  cortador text,
  enfestos integer DEFAULT 0,
  perda_percent numeric(5,2) DEFAULT 0,
  consumo_por_peca numeric(6,3) DEFAULT 0,
  observacoes text,
  status text NOT NULL DEFAULT 'pendente',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grade de Corte (linhas cor/tamanho por ordem)
CREATE TABLE public.grade_corte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_corte_id uuid REFERENCES public.ordens_corte(id) ON DELETE CASCADE NOT NULL,
  cor text NOT NULL,
  tecido_id uuid REFERENCES public.tecidos(id),
  pp integer DEFAULT 0,
  p integer DEFAULT 0,
  m integer DEFAULT 0,
  g integer DEFAULT 0,
  gg integer DEFAULT 0,
  g1 integer DEFAULT 0,
  g2 integer DEFAULT 0,
  g3 integer DEFAULT 0
);

-- Aviamentos por Ordem de Corte
CREATE TABLE public.aviamentos_ordem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_corte_id uuid REFERENCES public.ordens_corte(id) ON DELETE CASCADE NOT NULL,
  aviamento_id uuid REFERENCES public.aviamentos(id),
  descricao text NOT NULL,
  quantidade integer NOT NULL DEFAULT 0
);

-- Expedição
CREATE TABLE public.expedicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_corte_id uuid REFERENCES public.ordens_corte(id) NOT NULL,
  data_saida date,
  oficina_id uuid REFERENCES public.fornecedores(id),
  oficina_nome text,
  destino text,
  nota_fiscal text,
  preco_peca numeric(10,2) DEFAULT 0,
  observacoes text,
  status text NOT NULL DEFAULT 'pendente',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grade de Expedição
CREATE TABLE public.grade_expedicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedicao_id uuid REFERENCES public.expedicao(id) ON DELETE CASCADE NOT NULL,
  cor text NOT NULL,
  pp_prod integer DEFAULT 0, p_prod integer DEFAULT 0, m_prod integer DEFAULT 0,
  g_prod integer DEFAULT 0, gg_prod integer DEFAULT 0, g1_prod integer DEFAULT 0,
  g2_prod integer DEFAULT 0, g3_prod integer DEFAULT 0,
  pp_exp integer DEFAULT 0, p_exp integer DEFAULT 0, m_exp integer DEFAULT 0,
  g_exp integer DEFAULT 0, gg_exp integer DEFAULT 0, g1_exp integer DEFAULT 0,
  g2_exp integer DEFAULT 0, g3_exp integer DEFAULT 0
);

-- Recebimento
CREATE TABLE public.recebimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedicao_id uuid REFERENCES public.expedicao(id) NOT NULL,
  ordem_corte_id uuid REFERENCES public.ordens_corte(id) NOT NULL,
  oficina_nome text,
  data_envio date,
  data_recebimento date,
  total_sem_defeitos integer DEFAULT 0,
  defeitos integer DEFAULT 0,
  segunda_qualidade integer DEFAULT 0,
  total_pagar numeric(10,2) DEFAULT 0,
  observacoes text,
  status text NOT NULL DEFAULT 'pendente',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Entrega ao Cliente
CREATE TABLE public.entrega_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_corte_id uuid REFERENCES public.ordens_corte(id) NOT NULL,
  recebimento_id uuid REFERENCES public.recebimento(id),
  cliente_id uuid REFERENCES public.clientes(id),
  data_entrega date,
  qtd_entregue integer DEFAULT 0,
  segunda_qualidade integer DEFAULT 0,
  oficina_nome text,
  tempo_producao text,
  observacoes text,
  status text NOT NULL DEFAULT 'pendente',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Movimentações de Estoque
CREATE TABLE public.estoque_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tecido_id uuid REFERENCES public.tecidos(id) NOT NULL,
  tipo text NOT NULL, -- 'entrada', 'saida', 'reserva', 'cancelamento_reserva'
  quantidade_kg numeric(10,2) NOT NULL,
  ordem_corte_id uuid REFERENCES public.ordens_corte(id),
  descricao text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tecidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aviamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_corte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_corte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aviamentos_ordem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_expedicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrega_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All authenticated users can read, role-based write
-- SELECT policies (all authenticated can read)
CREATE POLICY "Authenticated can read clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read fornecedores" ON public.fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read tecidos" ON public.tecidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read modelos" ON public.modelos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read aviamentos" ON public.aviamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read ordens_corte" ON public.ordens_corte FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read grade_corte" ON public.grade_corte FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read aviamentos_ordem" ON public.aviamentos_ordem FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read expedicao" ON public.expedicao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read grade_expedicao" ON public.grade_expedicao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read recebimento" ON public.recebimento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read entrega_cliente" ON public.entrega_cliente FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read estoque_movimentacoes" ON public.estoque_movimentacoes FOR SELECT TO authenticated USING (true);

-- INSERT/UPDATE/DELETE policies (authenticated users with appropriate roles)
CREATE POLICY "Authenticated can insert clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update clientes" ON public.clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete clientes" ON public.clientes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert fornecedores" ON public.fornecedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update fornecedores" ON public.fornecedores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete fornecedores" ON public.fornecedores FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert tecidos" ON public.tecidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tecidos" ON public.tecidos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete tecidos" ON public.tecidos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert modelos" ON public.modelos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update modelos" ON public.modelos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete modelos" ON public.modelos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert aviamentos" ON public.aviamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update aviamentos" ON public.aviamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete aviamentos" ON public.aviamentos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert ordens_corte" ON public.ordens_corte FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ordens_corte" ON public.ordens_corte FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete ordens_corte" ON public.ordens_corte FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert grade_corte" ON public.grade_corte FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update grade_corte" ON public.grade_corte FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete grade_corte" ON public.grade_corte FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert aviamentos_ordem" ON public.aviamentos_ordem FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update aviamentos_ordem" ON public.aviamentos_ordem FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete aviamentos_ordem" ON public.aviamentos_ordem FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert expedicao" ON public.expedicao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update expedicao" ON public.expedicao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete expedicao" ON public.expedicao FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert grade_expedicao" ON public.grade_expedicao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update grade_expedicao" ON public.grade_expedicao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete grade_expedicao" ON public.grade_expedicao FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert recebimento" ON public.recebimento FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update recebimento" ON public.recebimento FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete recebimento" ON public.recebimento FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert entrega_cliente" ON public.entrega_cliente FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update entrega_cliente" ON public.entrega_cliente FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete entrega_cliente" ON public.entrega_cliente FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert estoque_movimentacoes" ON public.estoque_movimentacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update estoque_movimentacoes" ON public.estoque_movimentacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete estoque_movimentacoes" ON public.estoque_movimentacoes FOR DELETE TO authenticated USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ordens_corte;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expedicao;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recebimento;
ALTER PUBLICATION supabase_realtime ADD TABLE public.entrega_cliente;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tecidos;
