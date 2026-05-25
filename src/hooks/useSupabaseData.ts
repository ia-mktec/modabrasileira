import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { fetchAllRows } from "@/lib/fetch-all-rows";

// ===== CLIENTES =====
export function useClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await fetchAllRows((from, to) =>
      supabase.from("clientes").select("*").order("razao_social").range(from, to),
    );
    if (error) { toast({ title: "Erro ao buscar clientes", description: error.message, variant: "destructive" }); }
    else setClientes(data);
    setLoading(false);
  }, []);

  const salvarCliente = useCallback(async (cliente: {
    razao_social: string; cnpj?: string; contato?: string; telefone?: string;
    cidade?: string; uf?: string; prazo_recebimento?: number; status?: string;
  }, existingId?: string) => {
    try {
      if (existingId) {
        const { error } = await supabase.from("clientes").update(cliente).eq("id", existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("clientes").insert(cliente).select("id").single();
        if (error) throw error;
        existingId = data.id;
      }
      await fetch();
      return existingId;
    } catch (error: any) {
      toast({ title: "Erro ao salvar cliente", description: error.message, variant: "destructive" });
      return null;
    }
  }, [fetch]);

  const deletarCliente = useCallback(async (id: string) => {
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  return { clientes, loading, refetch: fetch, salvarCliente, deletarCliente };
}

// ===== FORNECEDORES =====
export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await fetchAllRows((from, to) =>
      supabase.from("fornecedores").select("*").order("razao_social").range(from, to),
    );
    if (error) { toast({ title: "Erro ao buscar fornecedores", description: error.message, variant: "destructive" }); }
    else setFornecedores(data);
    setLoading(false);
  }, []);

  const salvarFornecedor = useCallback(async (fornecedor: {
    razao_social: string; cnpj?: string; contato?: string; telefone?: string;
    email?: string; cidade?: string; uf?: string; tipo?: string;
    prazo_pagamento?: number; status?: string;
  }, existingId?: string) => {
    try {
      if (existingId) {
        const { error } = await supabase.from("fornecedores").update(fornecedor).eq("id", existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("fornecedores").insert(fornecedor).select("id").single();
        if (error) throw error;
        existingId = data.id;
      }
      await fetch();
      return existingId;
    } catch (error: any) {
      toast({ title: "Erro ao salvar fornecedor", description: error.message, variant: "destructive" });
      return null;
    }
  }, [fetch]);

  const deletarFornecedor = useCallback(async (id: string) => {
    const { error } = await supabase.from("fornecedores").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  return { fornecedores, loading, refetch: fetch, salvarFornecedor, deletarFornecedor };
}

// ===== TECIDOS =====
export function useTecidos() {
  const [tecidos, setTecidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await fetchAllRows((from, to) =>
      supabase.from("tecidos").select("*, clientes(razao_social)").order("nome").range(from, to),
    );
    if (error) { toast({ title: "Erro ao buscar tecidos", description: error.message, variant: "destructive" }); }
    else setTecidos(data);
    setLoading(false);
  }, []);

  const salvarTecido = useCallback(async (tecido: {
    nome: string; composicao?: string; cor?: string; cliente_id?: string;
    estoque_kg?: number; preco_kg?: number; largura?: number; peso?: number; status?: string;
  }, existingId?: string) => {
    try {
      if (existingId) {
        const { error } = await supabase.from("tecidos").update(tecido).eq("id", existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("tecidos").insert(tecido).select("id").single();
        if (error) throw error;
        existingId = data.id;
      }
      await fetch();
      return existingId;
    } catch (error: any) {
      toast({ title: "Erro ao salvar tecido", description: error.message, variant: "destructive" });
      return null;
    }
  }, [fetch]);

  const updateEstoque = useCallback(async (tecidoId: string, novoEstoque: number) => {
    const { error } = await supabase.from("tecidos").update({ estoque_kg: novoEstoque }).eq("id", tecidoId);
    if (error) { toast({ title: "Erro ao atualizar estoque", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  }, [fetch]);

  const deletarTecido = useCallback(async (id: string) => {
    const { error } = await supabase.from("tecidos").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  return { tecidos, loading, refetch: fetch, salvarTecido, updateEstoque, deletarTecido };
}

// ===== MODELOS =====
export function useModelos() {
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const pageSize = 1000;
    let from = 0;
    const all: any[] = [];
    while (true) {
      const { data, error } = await supabase
        .from("modelos")
        .select("*")
        .order("referencia")
        .range(from, from + pageSize - 1);
      if (error) {
        toast({ title: "Erro ao buscar modelos", description: error.message, variant: "destructive" });
        break;
      }
      const batch = data || [];
      all.push(...batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }
    setModelos(all);
    setLoading(false);
  }, []);

  const salvarModelo = useCallback(async (
    modelo: Record<string, any>,
    existingId?: string,
    children?: {
      aviamentos?: { ordem: number; descricao?: string; quantidade?: number; unidade?: string; observacao?: string }[];
      servicos?: { ordem: number; descricao?: string; valor_unitario?: number; observacao?: string }[];
      gradacao?: { ordem: number; tamanho?: string; medida_a?: number; medida_b?: number; medida_c?: number; medida_d?: number; observacao?: string }[];
    }
  ) => {
    try {
      let modeloId = existingId;
      if (existingId) {
        const { error } = await supabase.from("modelos").update(modelo).eq("id", existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("modelos").insert(modelo as any).select("id").single();
        if (error) throw error;
        modeloId = data.id;
      }
      if (children && modeloId) {
        if (children.aviamentos) {
          await supabase.from("modelo_aviamentos" as any).delete().eq("modelo_id", modeloId);
          if (children.aviamentos.length) {
            await supabase.from("modelo_aviamentos" as any).insert(children.aviamentos.map(r => ({ ...r, modelo_id: modeloId })));
          }
        }
        if (children.servicos) {
          await supabase.from("modelo_servicos" as any).delete().eq("modelo_id", modeloId);
          if (children.servicos.length) {
            await supabase.from("modelo_servicos" as any).insert(children.servicos.map(r => ({ ...r, modelo_id: modeloId })));
          }
        }
        if (children.gradacao) {
          await supabase.from("modelo_gradacao" as any).delete().eq("modelo_id", modeloId);
          if (children.gradacao.length) {
            await supabase.from("modelo_gradacao" as any).insert(children.gradacao.map(r => ({ ...r, modelo_id: modeloId })));
          }
        }
      }
      await fetch();
      return modeloId;
    } catch (error: any) {
      toast({ title: "Erro ao salvar modelo", description: error.message, variant: "destructive" });
      return null;
    }
  }, [fetch]);

  const carregarModeloCompleto = useCallback(async (modeloId: string) => {
    const [av, sv, gr] = await Promise.all([
      supabase.from("modelo_aviamentos" as any).select("*").eq("modelo_id", modeloId).order("ordem"),
      supabase.from("modelo_servicos" as any).select("*").eq("modelo_id", modeloId).order("ordem"),
      supabase.from("modelo_gradacao" as any).select("*").eq("modelo_id", modeloId).order("ordem"),
    ]);
    return { aviamentos: av.data || [], servicos: sv.data || [], gradacao: gr.data || [] };
  }, []);

  const deletarModelo = useCallback(async (id: string) => {
    const { error } = await supabase.from("modelos").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  return { modelos, loading, refetch: fetch, salvarModelo, deletarModelo, carregarModeloCompleto };
}

// ===== AVIAMENTOS =====
export function useAviamentos() {
  const [aviamentos, setAviamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await fetchAllRows((from, to) =>
      supabase.from("aviamentos").select("*, fornecedores(razao_social)").order("tipo").order("descricao").range(from, to),
    );
    if (error) { toast({ title: "Erro ao buscar aviamentos", description: error.message, variant: "destructive" }); }
    else setAviamentos(data);
    setLoading(false);
  }, []);

  const salvarAviamento = useCallback(async (aviamento: {
    tipo: string; descricao: string; tamanho?: string; cor?: string;
    preco_un?: number; fornecedor_id?: string; codigo?: string | null;
  }, existingId?: string) => {
    try {
      if (existingId) {
        const { error } = await supabase.from("aviamentos").update(aviamento).eq("id", existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("aviamentos").insert(aviamento).select("id").single();
        if (error) throw error;
        existingId = data.id;
      }
      await fetch();
      return existingId;
    } catch (error: any) {
      toast({ title: "Erro ao salvar aviamento", description: error.message, variant: "destructive" });
      return null;
    }
  }, [fetch]);

  const deletarAviamento = useCallback(async (id: string) => {
    const { error } = await supabase.from("aviamentos").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  return { aviamentos, loading, refetch: fetch, salvarAviamento, deletarAviamento };
}

// ===== ORDENS DE CORTE =====
export function useOrdensCorte() {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const PAGE = 1000;
    let from = 0;
    const all: any[] = [];
    // Pagina para contornar o limite padrão de 1000 linhas do Supabase
    // (existem ~3k+ ordens no banco e todas com mesmo created_at do import).
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data, error } = await supabase
        .from("ordens_corte")
        .select("id,numero,numero_pedido,modelo_ref,modelo_id,tecido_nome,tecido_id,cliente_id,quantidade_pecas,data_corte,cortador,enfestos,perda_percent,consumo_por_peca,observacoes,status,created_at,updated_at")
        .order("data_corte", { ascending: false, nullsFirst: false })
        .order("numero", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) {
        toast({ title: "Erro ao buscar ordens", description: error.message, variant: "destructive" });
        break;
      }
      all.push(...(data || []));
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
    setOrdens(all);
    setLoading(false);
  }, []);

  const salvarOrdem = useCallback(async (ordem: {
    numero: string; modelo_ref: string; tecido_nome: string;
    tecido_id?: string; modelo_id?: string; cliente_id?: string;
    quantidade_pecas: number; data_corte?: string; cortador?: string;
    enfestos?: number; perda_percent?: number; consumo_por_peca?: number;
    observacoes?: string; status: string; numero_pedido?: string;
  }, grade: { cor: string; tecido_id?: string; pp: number; p: number; m: number; g: number; gg: number; g1: number; g2: number; g3: number; }[], aviamentos: { descricao: string; quantidade: number; }[], existingId?: string) => {
    try {
      let ordemId = existingId;
      if (existingId) {
        const { error } = await supabase.from("ordens_corte").update(ordem).eq("id", existingId);
        if (error) throw error;
        await supabase.from("grade_corte").delete().eq("ordem_corte_id", existingId);
        await supabase.from("aviamentos_ordem").delete().eq("ordem_corte_id", existingId);
      } else {
        const { data, error } = await supabase.from("ordens_corte").insert(ordem).select("id").single();
        if (error) throw error;
        ordemId = data.id;
      }
      if (grade.length > 0 && ordemId) {
        const gradeRows = grade.map(g => ({ ordem_corte_id: ordemId, ...g }));
        const { error } = await supabase.from("grade_corte").insert(gradeRows);
        if (error) throw error;
      }
      if (aviamentos.length > 0 && ordemId) {
        const avRows = aviamentos.map(a => ({ ordem_corte_id: ordemId, descricao: a.descricao, quantidade: a.quantidade }));
        const { error } = await supabase.from("aviamentos_ordem").insert(avRows);
        if (error) throw error;
      }
      // Baixa de estoque ao concluir (apenas uma vez: quando o status muda para concluido)
      if (ordem.status === "concluido" && ordem.tecido_id && ordem.consumo_por_peca && ordem.quantidade_pecas) {
        const consumoTotal = Number(ordem.consumo_por_peca) * Number(ordem.quantidade_pecas);
        // Verifica se já existe movimentação de saída para esta ordem
        const { data: movExistente } = await supabase
          .from("estoque_movimentacoes")
          .select("id")
          .eq("ordem_corte_id", ordemId!)
          .eq("tipo", "saida")
          .maybeSingle();
        if (!movExistente && consumoTotal > 0) {
          const { data: tecidoData } = await supabase
            .from("tecidos").select("estoque_kg").eq("id", ordem.tecido_id).single();
          const novoEstoque = Math.max(0, Number(tecidoData?.estoque_kg || 0) - consumoTotal);
          await supabase.from("tecidos").update({ estoque_kg: novoEstoque }).eq("id", ordem.tecido_id);
          await supabase.from("estoque_movimentacoes").insert({
            tecido_id: ordem.tecido_id,
            quantidade_kg: consumoTotal,
            ordem_corte_id: ordemId!,
            tipo: "saida",
            descricao: `Baixa OC ${ordem.numero} — ${ordem.quantidade_pecas} peças`,
          });
        }
      }
      // Sincroniza status_kanban do pedido (Fase 4)
      if (ordem.numero_pedido) {
        const novoStatus = ordem.status === "concluido" ? "em_producao" : "em_corte";
        await supabase.from("modelo_pedidos")
          .update({ status_kanban: novoStatus })
          .eq("numero_pedido", ordem.numero_pedido);
      }
      await fetch();
      return ordemId;
    } catch (error: any) {
      toast({ title: "Erro ao salvar ordem", description: error.message, variant: "destructive" });
      return null;
    }
  }, [fetch]);

  const deletarOrdem = useCallback(async (id: string) => {
    const { error } = await supabase.from("ordens_corte").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  const loadOrdemDetalhada = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("ordens_corte")
      .select("*, grade_corte(*), aviamentos_ordem(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      toast({ title: "Erro ao carregar ordem", description: error.message, variant: "destructive" });
      return null;
    }
    return data;
  }, []);

  return { ordens, loading, refetch: fetch, salvarOrdem, deletarOrdem, loadOrdemDetalhada };
}

// ===== EXPEDIÇÃO =====
export function useExpedicao() {
  const [expedicoes, setExpedicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await fetchAllRows((from, to) =>
      supabase
        .from("expedicao")
        .select("id, ordem_corte_id, data_saida, oficina_nome, status, grade_expedicao(cor, pp_exp, p_exp, m_exp, g_exp, gg_exp, g1_exp, g2_exp, g3_exp)")
        .order("created_at", { ascending: false })
        .range(from, to),
    );
    if (error) { toast({ title: "Erro ao buscar expedições", description: error.message, variant: "destructive" }); }
    else setExpedicoes(data);
    setLoading(false);
  }, []);

  const salvarExpedicao = useCallback(async (exp: {
    ordem_corte_id: string; data_saida?: string; oficina_id?: string;
    oficina_nome?: string;
    preco_peca?: number; observacoes?: string; status: string;
  }, grade: { cor: string; pp_prod: number; p_prod: number; m_prod: number; g_prod: number; gg_prod: number; g1_prod: number; g2_prod: number; g3_prod: number; pp_exp: number; p_exp: number; m_exp: number; g_exp: number; gg_exp: number; g1_exp: number; g2_exp: number; g3_exp: number; }[], existingId?: string) => {
    try {
      let expId = existingId;
      if (existingId) {
        const { error } = await supabase.from("expedicao").update(exp).eq("id", existingId);
        if (error) throw error;
        await supabase.from("grade_expedicao").delete().eq("expedicao_id", existingId);
      } else {
        const { data, error } = await supabase.from("expedicao").insert(exp).select("id").single();
        if (error) throw error;
        expId = data.id;
      }
      if (grade.length > 0 && expId) {
        const rows = grade.map(g => ({ expedicao_id: expId, ...g }));
        const { error } = await supabase.from("grade_expedicao").insert(rows);
        if (error) throw error;
      }
      // Sincroniza status_kanban (Fase 4)
      const { data: ocData } = await supabase.from("ordens_corte")
        .select("numero_pedido").eq("id", exp.ordem_corte_id).single();
      if (ocData?.numero_pedido) {
        await supabase.from("modelo_pedidos")
          .update({ status_kanban: "em_producao" })
          .eq("numero_pedido", ocData.numero_pedido);
      }
      await fetch();
      return expId;
    } catch (error: any) {
      toast({ title: "Erro ao salvar expedição", description: error.message, variant: "destructive" });
      return null;
    }
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  return { expedicoes, loading, refetch: fetch, salvarExpedicao };
}

// ===== RECEBIMENTO =====
export function useRecebimento() {
  const [recebimentos, setRecebimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await fetchAllRows((from, to) =>
      supabase
        .from("recebimento")
        .select("*, ordens_corte(numero, modelo_ref, tecido_nome), expedicao(oficina_nome, data_saida)")
        .order("created_at", { ascending: false })
        .range(from, to),
    );
    if (error) { toast({ title: "Erro ao buscar recebimentos", description: error.message, variant: "destructive" }); }
    else setRecebimentos(data);
    setLoading(false);
  }, []);

  const salvarRecebimento = useCallback(async (rec: {
    expedicao_id: string; ordem_corte_id: string; oficina_nome?: string;
    data_envio?: string; data_recebimento?: string; total_sem_defeitos?: number;
    defeitos?: number; segunda_qualidade?: number; total_pagar?: number;
    observacoes?: string; status: string;
  }, existingId?: string) => {
    try {
      if (existingId) {
        const { error } = await supabase.from("recebimento").update(rec).eq("id", existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("recebimento").insert(rec).select("id").single();
        if (error) throw error;
        existingId = data.id;
      }
      // Sincroniza status_kanban (Fase 4)
      const { data: ocData } = await supabase.from("ordens_corte")
        .select("numero_pedido").eq("id", rec.ordem_corte_id).single();
      if (ocData?.numero_pedido) {
        await supabase.from("modelo_pedidos")
          .update({ status_kanban: "recebido" })
          .eq("numero_pedido", ocData.numero_pedido);
      }
      await fetch();
      return existingId;
    } catch (error: any) {
      toast({ title: "Erro ao salvar recebimento", description: error.message, variant: "destructive" });
      return null;
    }
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  return { recebimentos, loading, refetch: fetch, salvarRecebimento };
}

// ===== ENTREGA CLIENTE =====
export function useEntregaCliente() {
  const [entregas, setEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await fetchAllRows((from, to) =>
      supabase
        .from("entrega_cliente")
        .select("*, ordens_corte(numero, modelo_ref, tecido_nome), clientes(razao_social)")
        .order("created_at", { ascending: false })
        .range(from, to),
    );
    if (error) { toast({ title: "Erro ao buscar entregas", description: error.message, variant: "destructive" }); }
    else setEntregas(data);
    setLoading(false);
  }, []);

  const salvarEntrega = useCallback(async (ent: {
    ordem_corte_id: string; recebimento_id?: string; cliente_id?: string;
    data_entrega?: string; qtd_entregue?: number; segunda_qualidade?: number;
    oficina_nome?: string; tempo_producao?: string; observacoes?: string; status: string;
  }, existingId?: string) => {
    try {
      if (existingId) {
        const { error } = await supabase.from("entrega_cliente").update(ent).eq("id", existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("entrega_cliente").insert(ent).select("id").single();
        if (error) throw error;
        existingId = data.id;
      }
      // Sincroniza status_kanban (Fase 4)
      const { data: ocData } = await supabase.from("ordens_corte")
        .select("numero_pedido").eq("id", ent.ordem_corte_id).single();
      if (ocData?.numero_pedido) {
        await supabase.from("modelo_pedidos")
          .update({ status_kanban: "entregue" })
          .eq("numero_pedido", ocData.numero_pedido);
      }
      await fetch();
      return existingId;
    } catch (error: any) {
      toast({ title: "Erro ao salvar entrega", description: error.message, variant: "destructive" });
      return null;
    }
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  return { entregas, loading, refetch: fetch, salvarEntrega };
}

// ===== ESTOQUE MOVIMENTAÇÕES =====
export function useEstoqueMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("estoque_movimentacoes")
      .select("*, tecidos(nome, cor)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error) setMovimentacoes(data || []);
  }, []);

  const registrarMovimentacao = useCallback(async (mov: {
    tecido_id: string; tipo: string; quantidade_kg: number;
    ordem_corte_id?: string; descricao?: string;
  }) => {
    const { error } = await supabase.from("estoque_movimentacoes").insert(mov);
    if (error) { toast({ title: "Erro ao registrar movimentação", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  return { movimentacoes, refetch: fetch, registrarMovimentacao };
}
