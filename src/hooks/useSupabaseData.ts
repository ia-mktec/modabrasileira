import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ===== CLIENTES =====
export function useClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase.from("clientes").select("*").order("razao_social");
    if (error) { toast({ title: "Erro ao buscar clientes", description: error.message, variant: "destructive" }); }
    else setClientes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { clientes, loading, refetch: fetch };
}

// ===== FORNECEDORES =====
export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase.from("fornecedores").select("*").order("razao_social");
    if (error) { toast({ title: "Erro ao buscar fornecedores", description: error.message, variant: "destructive" }); }
    else setFornecedores(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { fornecedores, loading, refetch: fetch };
}

// ===== TECIDOS =====
export function useTecidos() {
  const [tecidos, setTecidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase.from("tecidos").select("*, clientes(razao_social)").order("nome");
    if (error) { toast({ title: "Erro ao buscar tecidos", description: error.message, variant: "destructive" }); }
    else setTecidos(data || []);
    setLoading(false);
  }, []);

  const updateEstoque = useCallback(async (tecidoId: string, novoEstoque: number) => {
    const { error } = await supabase.from("tecidos").update({ estoque_kg: novoEstoque }).eq("id", tecidoId);
    if (error) { toast({ title: "Erro ao atualizar estoque", description: error.message, variant: "destructive" }); return false; }
    return true;
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { tecidos, loading, refetch: fetch, updateEstoque };
}

// ===== MODELOS =====
export function useModelos() {
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase.from("modelos").select("*").order("referencia");
    if (error) { toast({ title: "Erro ao buscar modelos", description: error.message, variant: "destructive" }); }
    else setModelos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { modelos, loading, refetch: fetch };
}

// ===== AVIAMENTOS =====
export function useAviamentos() {
  const [aviamentos, setAviamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase.from("aviamentos").select("*").order("tipo, descricao");
    if (error) { toast({ title: "Erro ao buscar aviamentos", description: error.message, variant: "destructive" }); }
    else setAviamentos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { aviamentos, loading, refetch: fetch };
}

// ===== ORDENS DE CORTE =====
export function useOrdensCorte() {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("ordens_corte")
      .select("*, grade_corte(*), aviamentos_ordem(*)")
      .order("created_at", { ascending: false });
    if (error) { toast({ title: "Erro ao buscar ordens", description: error.message, variant: "destructive" }); }
    else setOrdens(data || []);
    setLoading(false);
  }, []);

  const salvarOrdem = useCallback(async (ordem: {
    numero: string;
    modelo_ref: string;
    tecido_nome: string;
    tecido_id?: string;
    modelo_id?: string;
    cliente_id?: string;
    quantidade_pecas: number;
    data_corte?: string;
    cortador?: string;
    enfestos?: number;
    perda_percent?: number;
    consumo_por_peca?: number;
    observacoes?: string;
    status: string;
  }, grade: { cor: string; tecido_id?: string; pp: number; p: number; m: number; g: number; gg: number; g1: number; g2: number; g3: number; }[], aviamentos: { descricao: string; quantidade: number; }[], existingId?: string) => {
    try {
      let ordemId = existingId;

      if (existingId) {
        const { error } = await supabase.from("ordens_corte").update(ordem).eq("id", existingId);
        if (error) throw error;
        // Delete old grade and aviamentos
        await supabase.from("grade_corte").delete().eq("ordem_corte_id", existingId);
        await supabase.from("aviamentos_ordem").delete().eq("ordem_corte_id", existingId);
      } else {
        const { data, error } = await supabase.from("ordens_corte").insert(ordem).select("id").single();
        if (error) throw error;
        ordemId = data.id;
      }

      // Insert grade
      if (grade.length > 0 && ordemId) {
        const gradeRows = grade.map(g => ({ ordem_corte_id: ordemId, ...g }));
        const { error } = await supabase.from("grade_corte").insert(gradeRows);
        if (error) throw error;
      }

      // Insert aviamentos
      if (aviamentos.length > 0 && ordemId) {
        const avRows = aviamentos.map(a => ({ ordem_corte_id: ordemId, descricao: a.descricao, quantidade: a.quantidade }));
        const { error } = await supabase.from("aviamentos_ordem").insert(avRows);
        if (error) throw error;
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

  return { ordens, loading, refetch: fetch, salvarOrdem, deletarOrdem };
}

// ===== EXPEDIÇÃO =====
export function useExpedicao() {
  const [expedicoes, setExpedicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("expedicao")
      .select("*, ordens_corte(numero, modelo_ref, tecido_nome, status), grade_expedicao(*)")
      .order("created_at", { ascending: false });
    if (error) { toast({ title: "Erro ao buscar expedições", description: error.message, variant: "destructive" }); }
    else setExpedicoes(data || []);
    setLoading(false);
  }, []);

  const salvarExpedicao = useCallback(async (exp: {
    ordem_corte_id: string;
    data_saida?: string;
    oficina_id?: string;
    oficina_nome?: string;
    destino?: string;
    nota_fiscal?: string;
    preco_peca?: number;
    observacoes?: string;
    status: string;
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
    const { data, error } = await supabase
      .from("recebimento")
      .select("*, ordens_corte(numero, modelo_ref, tecido_nome), expedicao(oficina_nome, data_saida)")
      .order("created_at", { ascending: false });
    if (error) { toast({ title: "Erro ao buscar recebimentos", description: error.message, variant: "destructive" }); }
    else setRecebimentos(data || []);
    setLoading(false);
  }, []);

  const salvarRecebimento = useCallback(async (rec: {
    expedicao_id: string;
    ordem_corte_id: string;
    oficina_nome?: string;
    data_envio?: string;
    data_recebimento?: string;
    total_sem_defeitos?: number;
    defeitos?: number;
    segunda_qualidade?: number;
    total_pagar?: number;
    observacoes?: string;
    status: string;
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
    const { data, error } = await supabase
      .from("entrega_cliente")
      .select("*, ordens_corte(numero, modelo_ref, tecido_nome), clientes(razao_social)")
      .order("created_at", { ascending: false });
    if (error) { toast({ title: "Erro ao buscar entregas", description: error.message, variant: "destructive" }); }
    else setEntregas(data || []);
    setLoading(false);
  }, []);

  const salvarEntrega = useCallback(async (ent: {
    ordem_corte_id: string;
    recebimento_id?: string;
    cliente_id?: string;
    data_entrega?: string;
    qtd_entregue?: number;
    segunda_qualidade?: number;
    oficina_nome?: string;
    tempo_producao?: string;
    observacoes?: string;
    status: string;
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
    tecido_id: string;
    tipo: string;
    quantidade_kg: number;
    ordem_corte_id?: string;
    descricao?: string;
  }) => {
    const { error } = await supabase.from("estoque_movimentacoes").insert(mov);
    if (error) { toast({ title: "Erro ao registrar movimentação", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);

  return { movimentacoes, refetch: fetch, registrarMovimentacao };
}
