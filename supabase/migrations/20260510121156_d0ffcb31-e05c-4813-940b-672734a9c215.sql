ALTER TABLE public.modelo_gradacao ADD COLUMN IF NOT EXISTS numero_pedido text;
CREATE INDEX IF NOT EXISTS idx_modelo_gradacao_numero_pedido ON public.modelo_gradacao(numero_pedido);

DELETE FROM public.entrega_cliente;
DELETE FROM public.recebimento;
DELETE FROM public.grade_expedicao;
DELETE FROM public.expedicao;
DELETE FROM public.aviamentos_ordem;
DELETE FROM public.grade_corte;
DELETE FROM public.ordens_corte;
DELETE FROM public.modelo_gradacao;
DELETE FROM public.modelo_aviamentos;
DELETE FROM public.modelo_servicos;
DELETE FROM public.aviamentos_pedido;
DELETE FROM public.modelo_pedidos;
DELETE FROM public.pedido_historico;
DELETE FROM public.modelos;