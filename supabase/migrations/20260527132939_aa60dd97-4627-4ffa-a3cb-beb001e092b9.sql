CREATE INDEX IF NOT EXISTS idx_expedicao_data_saida ON public.expedicao (data_saida DESC);
CREATE INDEX IF NOT EXISTS idx_expedicao_ordem_corte_id ON public.expedicao (ordem_corte_id);
CREATE INDEX IF NOT EXISTS idx_ordens_corte_numero ON public.ordens_corte (numero);
CREATE INDEX IF NOT EXISTS idx_ordens_corte_numero_pedido ON public.ordens_corte (numero_pedido);
CREATE INDEX IF NOT EXISTS idx_ordens_corte_modelo_ref ON public.ordens_corte (modelo_ref);
CREATE INDEX IF NOT EXISTS idx_grade_expedicao_expedicao_id ON public.grade_expedicao (expedicao_id);