import { useState, useCallback, useEffect } from "react";
import { formatDateBR } from "@/lib/utils";
import { PageLoading } from "@/components/shared/PageLoading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useOrdensCorte, useExpedicao, useFornecedores, useModelos, useClientes } from "@/hooks/useSupabaseData";
import { Search, Truck, Printer, PackageCheck, ImageOff, Send, CheckCircle, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { showSaving } from "@/lib/saving-toast";

const TAMANHOS = ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"];
const TAM_KEYS: Record<string, string> = { PP: "pp", P: "p", M: "m", G: "g", GG: "gg", G1: "g1", G2: "g2", G3: "g3" };

interface GradeExpRow {
  id: string;
  cor: string;
  qtdProduzida: Record<string, number>;
  qtdEnviadaAnterior: Record<string, number>;
  qtdEnviar: Record<string, string>;
}

// Gradação de aviamentos from Modelos
interface GradacaoRow {
  descricao: string;
  aumentoCm: string;
  pp: string;
  p: string;
  m: string;
  g: string;
  gg: string;
  g1: string;
  g2: string;
  g3: string;
}

const ExpedicaoPage = () => {
  const { ordens: ordensCorteDb, loading: loadingOrdens, loadOrdemDetalhada } = useOrdensCorte();
  const { expedicoes: expedicoesDb, salvarExpedicao } = useExpedicao();
  const { fornecedores: fornecedoresDb } = useFornecedores();
  const { modelos: modelosDb, loading: loadingModelos, carregarModeloCompleto } = useModelos();
  const { clientes: clientesDb } = useClientes();
  const [currentOrdemCorteId, setCurrentOrdemCorteId] = useState<string | null>(null);
  // Dados da ordem (consulta - read only)
  const [numero, setNumero] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [modeloRef, setModeloRef] = useState("");
  const [modeloNome, setModeloNome] = useState("");
  const [tecido, setTecido] = useState("");
  const [dataCorte, setDataCorte] = useState("");
  const [cortador, setCortador] = useState("");
  const [statusOrdem, setStatusOrdem] = useState("");
  const [cliente, setCliente] = useState("");

  // Dados editáveis da expedição (amarelo)
  const [dataSaida, setDataSaida] = useState("");
  const [oficina, setOficina] = useState("");
  const [oficinaSearchOpen, setOficinaSearchOpen] = useState(false);
  const [oficinaSearchTerm, setOficinaSearchTerm] = useState("");
  const [preco, setPreco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [obsModelo, setObsModelo] = useState("");
  const [obsCorte, setObsCorte] = useState("");
  const [statusKanban, setStatusKanban] = useState("");

  // Imagem da referência
  const [refImage, setRefImage] = useState<string | null>(null);

  // Dados da Entrada Oficina (editáveis - persistidos em recebimento)
  const [entradaOficinaData, setEntradaOficinaData] = useState("");
  const [entradaOficinaQtd, setEntradaOficinaQtd] = useState<number | null>(null);
  const [recebimentoIdEdit, setRecebimentoIdEdit] = useState<string | null>(null);
  const [savingEntrada, setSavingEntrada] = useState(false);

  // Grade (consulta only)
  const [gradeRows, setGradeRows] = useState<GradeExpRow[]>([]);

  // Aviamentos do modelo (consulta) with envio (editável)
  const [aviamentosExp, setAviamentosExp] = useState<{id: string;descricao: string;tipo: string;qtdModelo: number;qtdEnvio: string;}[]>([]);

  // Gradação de aviamentos (consulta from Modelos)
  const [gradacaoRows, setGradacaoRows] = useState<GradacaoRow[]>([]);

  // Entretela / Forro (consulta from Modelos)
  const [modeloExtras, setModeloExtras] = useState<{
    entretela: boolean;
    entretela_descricao: string | null;
    entretela_quantidade: number;
    entretela_consumo_peca: number;
    forro_tecido2: boolean;
    forro_tecido2_descricao: string | null;
    forro_tecido2_quantidade: number;
    forro_tecido2_consumo_peca: number;
  } | null>(null);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // View mode (ficha | historico)
  type ViewMode = "ficha" | "historico";
  const [viewMode, setViewMode] = useState<ViewMode>("ficha");

  // Histórico — filtros
  const [filtroOrdem, setFiltroOrdem] = useState("");
  const [filtroPedido, setFiltroPedido] = useState("");
  const [filtroOficina, setFiltroOficina] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataDe, setFiltroDataDe] = useState("");
  const [filtroDataAte, setFiltroDataAte] = useState("");

  interface RegistroExpedicao {
    id: string;
    data_saida: string | null;
    oficina_nome: string | null;
    status: string | null;
    preco_peca: number | null;
    observacoes: string | null;
    created_at: string;
    ordem_corte_id: string;
    ordens_corte?: { numero: string; numero_pedido: string | null; modelo_ref: string | null; tecido_nome: string | null } | null;
    grade_expedicao?: any[];
  }
  const [registros, setRegistros] = useState<RegistroExpedicao[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);

  useEffect(() => {
    if (viewMode !== "historico") return;
    let cancelled = false;
    (async () => {
      setLoadingRegistros(true);
      const rowsAll: any[] = [];
      const step = 1000;
      let from = 0;
      let lastError: any = null;
      while (true) {
        let q = supabase
          .from("expedicao")
          .select("id,data_saida,oficina_nome,status,preco_peca,observacoes,created_at,ordem_corte_id,grade_expedicao(pp_exp,p_exp,m_exp,g_exp,gg_exp,g1_exp,g2_exp,g3_exp)")
          .order("data_saida", { ascending: false, nullsFirst: false })
          .range(from, from + step - 1);
        if (filtroOficina) q = q.ilike("oficina_nome", `%${filtroOficina}%`);
        if (filtroStatus) q = q.eq("status", filtroStatus);
        if (filtroDataDe) q = q.gte("data_saida", filtroDataDe);
        if (filtroDataAte) q = q.lte("data_saida", filtroDataAte);
        const { data, error } = await q;
        if (error) { lastError = error; break; }
        const batch = data || [];
        rowsAll.push(...batch);
        if (batch.length < step) break;
        from += step;
      }
      if (!cancelled) {
        let rows: any[] = lastError ? [] : rowsAll;
        if (rows.length && (filtroOrdem || filtroPedido)) {
          const ocMap: Record<string, any> = {};
          ordensCorteDb.forEach((o: any) => { ocMap[o.id] = o; });
          rows = rows.filter((r) => {
            const oc = ocMap[r.ordem_corte_id];
            if (!oc) return false;
            if (filtroOrdem && !(oc.numero || "").toLowerCase().includes(filtroOrdem.toLowerCase())) return false;
            if (filtroPedido && !(oc.numero_pedido || "").toLowerCase().includes(filtroPedido.toLowerCase())) return false;
            return true;
          });
        }
        // anexa dados da OC para exibição
        const ocMap: Record<string, any> = {};
        ordensCorteDb.forEach((o: any) => { ocMap[o.id] = o; });
        rows = rows.map((r) => ({ ...r, ordens_corte: ocMap[r.ordem_corte_id] || null }));
        setRegistros(rows as RegistroExpedicao[]);
        setLoadingRegistros(false);
      }
    })();
    return () => { cancelled = true; };
  }, [viewMode, filtroOrdem, filtroPedido, filtroOficina, filtroStatus, filtroDataDe, filtroDataAte, ordensCorteDb]);

  const limparFiltros = () => {
    setFiltroOrdem(""); setFiltroPedido(""); setFiltroOficina("");
    setFiltroStatus(""); setFiltroDataDe(""); setFiltroDataAte("");
  };

  const totalPecasGrade = (grades: any[] | undefined) =>
    (grades || []).reduce((s, g: any) =>
      s + (g.pp_exp||0)+(g.p_exp||0)+(g.m_exp||0)+(g.g_exp||0)+(g.gg_exp||0)+(g.g1_exp||0)+(g.g2_exp||0)+(g.g3_exp||0), 0);

  const loadRegistroExpedicao = (r: RegistroExpedicao) => {
    const oc = ordensCorteDb.find((o: any) => o.id === r.ordem_corte_id);
    if (!oc) {
      toast({ title: "Ordem não encontrada", description: "A ordem de corte vinculada a esta expedição não está disponível.", variant: "destructive" });
      return;
    }
    setViewMode("ficha");
    loadOrdem(oc);
  };

  const filteredOrdens = ordensCorteDb.filter(
    (oc: any) =>
    (oc.numero || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (oc.numero_pedido || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (oc.modelo_ref || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusLabel = (s: string) => {
    switch (s) {
      case "pendente":return "Pendente";
      case "em_andamento":return "Em Andamento";
      case "concluido":return "Concluído";
      case "cancelado":return "Cancelado";
      default:return s;
    }
  };

  const loadOrdem = async (oc: any) => {
    setCurrentOrdemCorteId(oc.id);
    setNumero(oc.numero);
    setNumeroPedido(oc.numero_pedido || "");
    setModeloRef(oc.modelo_ref || "");
    const refTrim = (oc.modelo_ref || "").trim().toLowerCase();
    const candidatos = modelosDb.filter((m: any) => (m.referencia || "").trim().toLowerCase() === refTrim);
    const foundModelo = candidatos.find((m: any) => !!m.imagem_url) || candidatos[0];
    setModeloNome(foundModelo?.descricao || "");
    setTecido(oc.tecido_nome || foundModelo?.tecido_principal || "");
    setDataCorte(oc.data_corte || "");
    setCortador(oc.cortador || "");
    setStatusOrdem(oc.status || "");
    // Resolve cliente: prefer ordens_corte.cliente_id → clientes; fallback to modelo_pedidos.cliente by numero_pedido
    let nomeCliente = "";
    if (oc.cliente_id) {
      const c = (clientesDb || []).find((x: any) => x.id === oc.cliente_id);
      if (c) nomeCliente = c.razao_social || "";
    }
    if (!nomeCliente && oc.numero_pedido) {
      const { data: pedido } = await supabase
        .from("modelo_pedidos")
        .select("cliente")
        .eq("numero_pedido", oc.numero_pedido)
        .maybeSingle();
      if (pedido?.cliente) nomeCliente = pedido.cliente;
    }
    setCliente(nomeCliente);
    setRefImage(foundModelo?.imagem_url || null);
    setSearchOpen(false);
    setIsLoaded(true);
    setDataSaida("");
    setOficina("");
    setPreco("");
    setObservacoes("");
    setObsModelo((foundModelo as any)?.observacoes || "");
    setObsCorte(oc.observacoes || "");
    setStatusKanban("");
    setGradeRows([]);
    setAviamentosExp([]);
    setGradacaoRows([]);
    setModeloExtras(
      foundModelo
        ? {
            entretela: !!foundModelo.entretela,
            entretela_descricao: foundModelo.entretela_descricao || null,
            entretela_quantidade: Number(foundModelo.entretela_quantidade) || 0,
            entretela_consumo_peca: Number((foundModelo as any).entretela_consumo_peca) || 0,
            forro_tecido2: !!foundModelo.forro_tecido2,
            forro_tecido2_descricao: foundModelo.forro_tecido2_descricao || null,
            forro_tecido2_quantidade: Number(foundModelo.forro_tecido2_quantidade) || 0,
            forro_tecido2_consumo_peca: Number((foundModelo as any).forro_tecido2_consumo_peca) || 0,
          }
        : null
    );
    setEntradaOficinaData("");
    setEntradaOficinaQtd(null);
    setRecebimentoIdEdit(null);

    // Load recebimento (Dados da Entrada Oficina)
    const { data: recs } = await supabase
      .from("recebimento")
      .select("id,data_recebimento,total_sem_defeitos,segunda_qualidade,defeitos")
      .eq("ordem_corte_id", oc.id)
      .order("data_recebimento", { ascending: false, nullsFirst: false })
      .limit(1);
    if (recs && recs.length > 0) {
      const r: any = recs[0];
      setRecebimentoIdEdit(r.id || null);
      setEntradaOficinaData(r.data_recebimento || "");
      const total = (r.total_sem_defeitos || 0) + (r.segunda_qualidade || 0);
      setEntradaOficinaQtd(total > 0 ? total : (r.total_sem_defeitos || 0));
    }

    // Fetch full ordem detail (grade_corte + aviamentos_ordem) and modelo children in parallel
    const [detalhe, modeloCompleto] = await Promise.all([
      loadOrdemDetalhada(oc.id),
      foundModelo?.id ? carregarModeloCompleto(foundModelo.id) : Promise.resolve(null),
    ]);

    const ordemFull = detalhe || oc;

    // Compute already shipped quantities (sum across previous expedicoes for this OC)
    const prevExps = (expedicoesDb || []).filter((e: any) => e.ordem_corte_id === oc.id);
    const enviadoPorCor: Record<string, Record<string, number>> = {};
    prevExps.forEach((e: any) => {
      (e.grade_expedicao || []).forEach((g: any) => {
        const cor = g.cor || "";
        if (!enviadoPorCor[cor]) enviadoPorCor[cor] = {};
        TAMANHOS.forEach((t) => {
          const k = `${TAM_KEYS[t]}_exp`;
          enviadoPorCor[cor][t] = (enviadoPorCor[cor][t] || 0) + (g[k] || 0);
        });
      });
    });

    // Load grade from ordem corte
    if (ordemFull.grade_corte && ordemFull.grade_corte.length > 0) {
      setGradeRows(ordemFull.grade_corte.map((g: any) => {
        const cor = g.cor || "";
        const enviada = enviadoPorCor[cor] || {};
        return {
          id: g.id || crypto.randomUUID(),
          cor,
          qtdProduzida: {
            PP: g.pp || 0, P: g.p || 0, M: g.m || 0, G: g.g || 0,
            GG: g.gg || 0, G1: g.g1 || 0, G2: g.g2 || 0, G3: g.g3 || 0,
          },
          qtdEnviadaAnterior: {
            PP: enviada.PP || 0, P: enviada.P || 0, M: enviada.M || 0, G: enviada.G || 0,
            GG: enviada.GG || 0, G1: enviada.G1 || 0, G2: enviada.G2 || 0, G3: enviada.G3 || 0,
          },
          qtdEnviar: { PP: "", P: "", M: "", G: "", GG: "", G1: "", G2: "", G3: "" },
        };
      }));
    }

    // Load aviamentos from ordem (fallback to model aviamentos when ordem has none)
    if (ordemFull.aviamentos_ordem && ordemFull.aviamentos_ordem.length > 0) {
      setAviamentosExp(ordemFull.aviamentos_ordem.map((a: any) => ({
        id: a.id || crypto.randomUUID(),
        descricao: a.descricao || "",
        tipo: "",
        qtdModelo: a.quantidade || 0,
        qtdEnvio: "",
      })));
    } else if (modeloCompleto?.aviamentos?.length) {
      setAviamentosExp(modeloCompleto.aviamentos.map((a: any) => ({
        id: a.id || crypto.randomUUID(),
        descricao: a.descricao || "",
        tipo: a.unidade || "",
        qtdModelo: Number(a.quantidade) || 0,
        qtdEnvio: "",
      })));
    }

    // Load gradação from modelo
    if (modeloCompleto?.gradacao?.length) {
      setGradacaoRows(modeloCompleto.gradacao.map((g: any) => {
        const aumento = (g.observacao || "").match(/Aumento:\s*([0-9.,]+)/i)?.[1] || "";
        return {
          descricao: g.tamanho || "",
          aumentoCm: aumento,
          pp: g.medida_a != null ? String(g.medida_a) : "",
          p: g.medida_b != null ? String(g.medida_b) : "",
          m: g.medida_c != null ? String(g.medida_c) : "",
          g: g.medida_d != null ? String(g.medida_d) : "",
          gg: "", g1: "", g2: "", g3: "",
        };
      }));
    }
  };

  const updateQtdEnviar = (rowId: string, tam: string, val: string) =>
    setGradeRows((prev) => prev.map((r) => r.id === rowId ? { ...r, qtdEnviar: { ...r.qtdEnviar, [tam]: val } } : r));

  // Distribui um total proporcionalmente conforme pesos (saldo por tamanho), com inteiros e remanejamento de resto
  const distributeByWeights = (total: number, weights: number[]): number[] => {
    const sumW = weights.reduce((a, b) => a + b, 0);
    if (sumW <= 0 || total <= 0) return weights.map(() => 0);
    const raw = weights.map((w) => (total * w) / sumW);
    const floored = raw.map((v) => Math.floor(v));
    let resto = total - floored.reduce((a, b) => a + b, 0);
    const fracs = raw
      .map((v, i) => ({ i, frac: v - Math.floor(v), w: weights[i] }))
      .sort((a, b) => b.frac - a.frac || b.w - a.w);
    let k = 0;
    while (resto > 0 && k < fracs.length * 4) {
      const idx = fracs[k % fracs.length].i;
      // Não exceder o peso (saldo) do tamanho
      if (floored[idx] < weights[idx]) {
        floored[idx] += 1;
        resto -= 1;
      }
      k += 1;
    }
    return floored;
  };

  const updateRowTotal = (rowId: string, totalStr: string) => {
    setGradeRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;
      const weights = TAMANHOS.map((t) => saldoCell(r, t));
      const sumW = weights.reduce((a, b) => a + b, 0);
      let total = parseInt(totalStr) || 0;
      if (total > sumW) total = sumW;
      const dist = distributeByWeights(total, weights);
      const qtdEnviar: Record<string, string> = {};
      TAMANHOS.forEach((t, i) => { qtdEnviar[t] = dist[i] > 0 ? String(dist[i]) : ""; });
      return { ...r, qtdEnviar };
    }));
  };

  const handleEnvioTotal = () => {
    setGradeRows((prev) =>
      prev.map((r) => {
        const qtdEnviar: Record<string, string> = {};
        TAMANHOS.forEach((t) => {
          const saldo = Math.max(0, (r.qtdProduzida[t] || 0) - (r.qtdEnviadaAnterior[t] || 0));
          qtdEnviar[t] = saldo > 0 ? String(saldo) : "";
        });
        return { ...r, qtdEnviar };
      })
    );
  };

  const totalProdBySize = (tam: string) => gradeRows.reduce((s, r) => s + (r.qtdProduzida[tam] || 0), 0);
  const totalProdGeral = TAMANHOS.reduce((s, t) => s + totalProdBySize(t), 0);
  const saldoCell = (row: GradeExpRow, tam: string) =>
    Math.max(0, (row.qtdProduzida[tam] || 0) - (row.qtdEnviadaAnterior[tam] || 0));
  const totalEnviarRow = (row: GradeExpRow) =>
    TAMANHOS.reduce((s, t) => s + (parseInt(row.qtdEnviar[t]) || 0), 0);
  const totalEnviarGeral = gradeRows.reduce((s, r) => s + totalEnviarRow(r), 0);

  const updateAviamentoEnvio = (id: string, val: string) =>
  setAviamentosExp((prev) => prev.map((a) => a.id === id ? { ...a, qtdEnvio: val } : a));

  const handleRegistrarSaida = async () => {
    if (!numero || !currentOrdemCorteId) {
      toast({ title: "Nenhuma ordem carregada", description: "Busque uma ordem de corte primeiro.", variant: "destructive" });
      return;
    }
    if (!dataSaida) {
      toast({ title: "Campo obrigatório", description: "Preencha a data de saída.", variant: "destructive" });
      return;
    }
    if (!oficina) {
      toast({ title: "Campo obrigatório", description: "Informe a oficina/prestador desta saída.", variant: "destructive" });
      return;
    }

    // Validação de saldo + filtra apenas linhas com quantidade enviada
    const gradeData: any[] = [];
    for (const row of gradeRows) {
      const qtdEnviar: Record<string, number> = {};
      let rowTotal = 0;
      for (const t of TAMANHOS) {
        const v = parseInt(row.qtdEnviar[t]) || 0;
        if (v < 0) continue;
        if (v > saldoCell(row, t)) {
          toast({ title: "Quantidade excede o saldo", description: `Cor ${row.cor} tamanho ${t}: saldo disponível ${saldoCell(row, t)}.`, variant: "destructive" });
          return;
        }
        qtdEnviar[t] = v;
        rowTotal += v;
      }
      if (rowTotal === 0) continue;
      gradeData.push({
        cor: row.cor,
        pp_prod: qtdEnviar.PP || 0, p_prod: qtdEnviar.P || 0,
        m_prod: qtdEnviar.M || 0, g_prod: qtdEnviar.G || 0,
        gg_prod: qtdEnviar.GG || 0, g1_prod: qtdEnviar.G1 || 0,
        g2_prod: qtdEnviar.G2 || 0, g3_prod: qtdEnviar.G3 || 0,
        pp_exp: qtdEnviar.PP || 0, p_exp: qtdEnviar.P || 0,
        m_exp: qtdEnviar.M || 0, g_exp: qtdEnviar.G || 0,
        gg_exp: qtdEnviar.GG || 0, g1_exp: qtdEnviar.G1 || 0,
        g2_exp: qtdEnviar.G2 || 0, g3_exp: qtdEnviar.G3 || 0,
      });
    }

    if (gradeData.length === 0) {
      toast({ title: "Nenhuma quantidade informada", description: "Informe a quantidade a enviar nesta saída parcial.", variant: "destructive" });
      return;
    }

    const dismissSaving = showSaving();
    let result;
    try {
      result = await salvarExpedicao({
        ordem_corte_id: currentOrdemCorteId,
        data_saida: dataSaida || null,
        oficina_nome: oficina || null,
        
        preco_peca: parseFloat(preco) || 0,
        observacoes: observacoes || null,
        status: statusKanban || "pendente",
      }, gradeData);
    } finally {
      dismissSaving();
    }

    if (result) {
      toast({ title: "Saída parcial registrada", description: `Oficina ${oficina} — ${totalEnviarGeral} peça(s).` });
      // Recarrega a ordem para atualizar saldos e limpar formulário
      const refreshed = ordensCorteDb.find((o: any) => o.id === currentOrdemCorteId);
      if (refreshed) loadOrdem(refreshed);
    }
  };

  const handleSalvarEntradaOficina = async () => {
    if (!currentOrdemCorteId) {
      toast({ title: "Nenhuma ordem carregada", description: "Busque uma ordem primeiro.", variant: "destructive" });
      return;
    }
    if (!entradaOficinaData) {
      toast({ title: "Campo obrigatório", description: "Informe a Data de Entrada da Oficina.", variant: "destructive" });
      return;
    }
    setSavingEntrada(true);
    const dismissSaving = showSaving();
    try {
      const qtd = entradaOficinaQtd != null ? Number(entradaOficinaQtd) : 0;
      if (recebimentoIdEdit) {
        const { error } = await supabase
          .from("recebimento")
          .update({ data_recebimento: entradaOficinaData, total_sem_defeitos: qtd })
          .eq("id", recebimentoIdEdit);
        if (error) throw error;
      } else {
        // Precisa de uma expedição vinculada
        const { data: exps } = await supabase
          .from("expedicao")
          .select("id,oficina_nome,data_saida")
          .eq("ordem_corte_id", currentOrdemCorteId)
          .order("data_saida", { ascending: false, nullsFirst: false })
          .limit(1);
        const expId = exps?.[0]?.id;
        if (!expId) {
          toast({ title: "Sem expedição", description: "Registre uma saída de expedição antes de informar a entrada na oficina.", variant: "destructive" });
          setSavingEntrada(false);
          return;
        }
        const { data: inserted, error } = await supabase
          .from("recebimento")
          .insert({
            ordem_corte_id: currentOrdemCorteId,
            expedicao_id: expId,
            oficina_nome: exps?.[0]?.oficina_nome || null,
            data_envio: exps?.[0]?.data_saida || null,
            data_recebimento: entradaOficinaData,
            total_sem_defeitos: qtd,
            status: "pendente",
          })
          .select("id")
          .single();
        if (error) throw error;
        setRecebimentoIdEdit(inserted?.id || null);
      }
      toast({ title: "Entrada da oficina salva", description: "Dados atualizados com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      dismissSaving();
      setSavingEntrada(false);
    }
  };

  const handlePrint = useCallback(() => {window.print();}, []);

  const yellowInput =
  "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)] print:bg-transparent print:border-[hsl(220,15%,80%)]";

  const readOnlyInput =
  "bg-muted text-foreground border-border cursor-default print:bg-transparent print:border-[hsl(220,15%,80%)]";

  const readOnlyDisplay =
  "h-9 w-full flex items-center px-3 rounded-md border bg-muted text-foreground border-border text-sm print:bg-transparent print:border-[hsl(220,15%,80%)] print:h-auto print:min-h-[28px] print:py-1";

  // Cores presentes no corte (para exibição na ficha)
  const coresDisplay = gradeRows.map((r) => r.cor).filter(Boolean).join(", ");


  if (loadingOrdens || loadingModelos) {
    return <PageLoading message="Carregando expedição..." />;
  }

  // ─── HISTÓRICO / CONFERIR ───
  if (viewMode === "historico") {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-[hsl(0,0%,100%)] hover:bg-[hsl(217,71%,35%)] shrink-0"
            onClick={() => setViewMode("ficha")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono flex-1 text-center pr-9">
            HISTÓRICO DE REGISTROS — EXPEDIÇÃO
          </h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Filtros</h3>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Ordem de Corte</Label>
                <Input value={filtroOrdem} onChange={(e) => setFiltroOrdem(e.target.value)} placeholder="OC-..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pedido</Label>
                <Input value={filtroPedido} onChange={(e) => setFiltroPedido(e.target.value)} placeholder="Filtrar..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Oficina</Label>
                <Input value={filtroOficina} onChange={(e) => setFiltroOficina(e.target.value)} placeholder="Filtrar..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={filtroStatus || "__all__"} onValueChange={(v) => setFiltroStatus(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data de</Label>
                <Input type="date" value={filtroDataDe} onChange={(e) => setFiltroDataDe(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data até</Label>
                <Input type="date" value={filtroDataAte} onChange={(e) => setFiltroDataAte(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold">Data Saída</th>
                    <th className="text-left py-3 px-4 font-semibold">Ordem</th>
                    <th className="text-left py-3 px-4 font-semibold">Pedido</th>
                    <th className="text-left py-3 px-4 font-semibold">Modelo</th>
                    <th className="text-left py-3 px-4 font-semibold">Tecido</th>
                    <th className="text-left py-3 px-4 font-semibold">Oficina</th>
                    <th className="text-center py-3 px-4 font-semibold">Peças</th>
                    <th className="text-right py-3 px-4 font-semibold">Preço/Peça</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-center py-3 px-4 font-semibold w-16">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => {
                    const oc = r.ordens_corte;
                    const pecas = totalPecasGrade(r.grade_expedicao);
                    const isConcluido = (r.status || "").toLowerCase() === "concluido";
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-4 font-mono">{formatDateBR(r.data_saida)}</td>
                        <td className="py-2 px-4 font-mono font-medium">{oc?.numero || "—"}</td>
                        <td className="py-2 px-4 font-mono text-muted-foreground">{oc?.numero_pedido || "—"}</td>
                        <td className="py-2 px-4">{oc?.modelo_ref || "—"}</td>
                        <td className="py-2 px-4 text-muted-foreground">{oc?.tecido_nome || "—"}</td>
                        <td className="py-2 px-4">{r.oficina_nome || "—"}</td>
                        <td className="py-2 px-4 text-center font-mono">{pecas}</td>
                        <td className="py-2 px-4 text-right font-mono">{Number(r.preco_peca || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                        <td className="py-2 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            isConcluido
                              ? "bg-[hsl(142_71%_35%/0.15)] text-[hsl(142,71%,35%)] border-[hsl(142_71%_35%/0.3)]"
                              : "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)] border-[hsl(38_92%_50%/0.3)]"
                          }`}>{statusLabel(r.status || "")}</span>
                        </td>
                        <td className="py-2 px-4 text-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadRegistroExpedicao(r)} title="Abrir registro">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {!loadingRegistros && registros.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground text-sm">
                        Nenhum registro encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                  {loadingRegistros && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground text-sm">Carregando...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-right">
          {registros.length} registro(s){registros.length >= 2000 ? " (limite atingido — refine os filtros)" : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 expedicao-ficha">
      <style>{`
        @media print {
          @page { size: A4; margin: 6mm; }
          .expedicao-ficha { padding: 0 !important; }
          .expedicao-ficha .space-y-4 > * + * { margin-top: 3px !important; }
          .expedicao-ficha .space-y-3 > * + * { margin-top: 2px !important; }
          .expedicao-ficha .space-y-1 > * + * { margin-top: 1px !important; }
          .expedicao-ficha .gap-4 { gap: 4px !important; }
          .expedicao-ficha .gap-3 { gap: 3px !important; }
          .expedicao-ficha input, .expedicao-ficha textarea {
            background: transparent !important;
            border-color: hsl(220 15% 80%) !important;
            color: hsl(220 30% 10%) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            height: auto !important;
            min-height: 18px !important;
            padding: 1px 4px !important;
            font-size: 9px !important;
          }
          .expedicao-ficha label { font-size: 8px !important; margin-bottom: 0 !important; line-height: 1.1 !important; }
          .expedicao-ficha .text-xs, .expedicao-ficha .text-\[10px\], .expedicao-ficha .text-\[11px\] { font-size: 8px !important; }
          .expedicao-ficha .text-sm { font-size: 9px !important; }
          .expedicao-ficha h1 { font-size: 12px !important; }
          .expedicao-ficha h3 { font-size: 10px !important; }
          .expedicao-ficha .p-4, .expedicao-ficha .md\:p-6, .expedicao-ficha .p-3 { padding: 3px !important; }
          .expedicao-ficha .p-2 { padding: 2px !important; }
          .expedicao-ficha .py-3 { padding-top: 2px !important; padding-bottom: 2px !important; }
          .expedicao-ficha .py-1\.5 { padding-top: 1px !important; padding-bottom: 1px !important; }
          .expedicao-ficha .px-4 { padding-left: 4px !important; padding-right: 4px !important; }
          .expedicao-ficha .dados-ordem-grid { grid-template-columns: repeat(6, minmax(0, 1fr)) !important; gap: 3px !important; }
          .expedicao-ficha .dados-ordem-grid .col-span-2 { grid-column: span 2 / span 2 !important; }
          .expedicao-ficha .dados-ordem-grid > div > div:last-child { min-height: 16px !important; padding: 1px 4px !important; font-size: 9px !important; line-height: 1.2 !important; }
          .expedicao-ficha .dados-ordem-readonly {
            height: auto !important;
            min-height: 16px !important;
            padding: 1px 4px !important;
            font-size: 9px !important;
            line-height: 1.2 !important;
          }
          .expedicao-ficha .grid-cols-1.md\:grid-cols-\[1fr_400px\] { grid-template-columns: 1fr 280px !important; gap: 6px !important; }
          .expedicao-ficha img { max-height: 320px !important; min-height: 280px !important; object-fit: contain !important; width: 100% !important; }
          .expedicao-ficha .min-h-\[200px\] { min-height: 0 !important; }
          .expedicao-ficha .print-hide-row { display: none !important; }
          .expedicao-ficha .print-saidas-parciais { display: none !important; }
          .expedicao-ficha .print-enviar-label::after { content: "Quantidade"; }
          .expedicao-ficha .print-enviar-label > span { display: none !important; }
          .expedicao-ficha table { font-size: 8px !important; }
          .expedicao-ficha table th, .expedicao-ficha table td { padding: 1px 3px !important; }
          .expedicao-ficha table, .expedicao-ficha [class*="rounded-lg"] {
            page-break-inside: avoid; break-inside: avoid;
          }
          .expedicao-ficha button { display: none !important; }
          .expedicao-ficha .print-page-break { page-break-before: always; break-before: page; }
        }
      `}</style>
      {/* Header */}
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">EXPEDIÇÃO — SAÍDA DE OFICINA</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Action Panel */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-3 md:w-40 shrink-0 print:hidden overflow-x-auto pb-2 md:pb-0">
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0">
                <Search className="w-4 h-4" />
                <span>Buscar Ordem</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Buscar Ordem de Corte</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Nº Ordem, Nº Pedido ou modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {filteredOrdens.map((oc: any) =>
                  <button key={oc.id} onClick={() => loadOrdem(oc)} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                      <div className="font-mono text-xs font-semibold text-primary">{oc.numero}</div>
                      {oc.numero_pedido && <div className="text-[10px] font-mono text-muted-foreground">Pedido: {oc.numero_pedido}</div>}
                      <div className="text-muted-foreground text-xs">{oc.modelo_ref} — {oc.tecido_nome}</div>
                      <div className="text-muted-foreground text-[10px]">{statusLabel(oc.status)} • {oc.quantidade_pecas} peças</div>
                    </button>
                  )}
                  {filteredOrdens.length === 0 &&
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ordem encontrada</p>
                  }
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Separator className="hidden md:block" />

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)]"
            onClick={handleRegistrarSaida}>
            
            <PackageCheck className="w-4 h-4" />
            <span>Registrar Saída</span>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 border-[hsl(199,89%,40%)] text-[hsl(199,89%,25%)] hover:bg-[hsl(199,89%,95%)]"
            onClick={handleEnvioTotal}
            disabled={gradeRows.length === 0}
          >
            <Send className="w-4 h-4" />
            <span>Enviar Tudo</span>
          </Button>

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(217,71%,45%)] hover:bg-[hsl(217,71%,38%)] text-[hsl(0,0%,100%)]"
            onClick={() => setViewMode("historico")}>
            <CheckCircle className="w-4 h-4" />
            <span>Conferir</span>
          </Button>

          <Separator className="hidden md:block" />

          <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </Button>
        </div>

        {/* Main Ficha Content */}
        <div className="flex-1 space-y-4">
          {/* Dados da Ordem — Consulta (read-only) */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">DADOS DA ORDEM</h3>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 dados-ordem-grid">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nº Ordem</Label>
                  <div className={readOnlyDisplay}><span className="truncate font-mono">{numero || "—"}</span></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nº Pedido</Label>
                  <div className={readOnlyDisplay}><span className="truncate font-mono">{numeroPedido || "—"}</span></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Referência</Label>
                  <div className={readOnlyDisplay}><span className="truncate">{modeloRef || "—"}</span></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Modelo</Label>
                  <div className={readOnlyDisplay}><span className="truncate">{modeloNome || "—"}</span></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Cliente</Label>
                  <div className={readOnlyDisplay}><span className="truncate">{cliente || "—"}</span></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tecido</Label>
                  <div className={readOnlyDisplay}><span className="truncate">{tecido || "—"}</span></div>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-semibold">Cor</Label>
                  <div className={readOnlyDisplay}><span className="truncate">{coresDisplay || "—"}</span></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Data do Corte</Label>
                  <div className={readOnlyDisplay}><span className="truncate font-mono">{dataCorte ? formatDateBR(dataCorte) : "—"}</span></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Cortador</Label>
                  <div className={readOnlyDisplay}><span className="truncate">{cortador || "—"}</span></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Qtde Peças</Label>
                  <div className={readOnlyDisplay}><span className="font-mono">{totalProdGeral > 0 ? totalProdGeral : "—"}</span></div>
                </div>
              </div>
            </CardContent>

          </Card>

          {/* Dados da Expedição + Imagem lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-4">
            <div className="space-y-4">
            <Card>
              <div className="bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
                <h3 className="text-sm font-bold tracking-wide text-center">DADOS DA EXPEDIÇÃO</h3>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Data de Saída</Label>
                    <Input type="date" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} className={yellowInput} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Oficina</Label>
                    <div className="flex gap-1">
                      <Input value={oficina} onChange={(e) => setOficina(e.target.value)} className={`flex-1 ${yellowInput}`} placeholder="Nome da oficina" />
                      <Sheet open={oficinaSearchOpen} onOpenChange={(open) => {setOficinaSearchOpen(open);setOficinaSearchTerm("");}}>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"><Search className="w-4 h-4" /></Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80">
                          <SheetHeader><SheetTitle>Buscar Oficina / Fornecedor</SheetTitle></SheetHeader>
                          <div className="mt-4 space-y-3">
                            <Input placeholder="Razão social ou cidade..." value={oficinaSearchTerm} onChange={(e) => setOficinaSearchTerm(e.target.value)} />
                            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                              {fornecedoresDb.
                              filter((f: any) =>
                              (f.razao_social || "").toLowerCase().includes(oficinaSearchTerm.toLowerCase()) ||
                              (f.cidade || "").toLowerCase().includes(oficinaSearchTerm.toLowerCase())
                              ).
                              map((f: any) =>
                              <button key={f.id} onClick={() => {setOficina(f.razao_social);setOficinaSearchOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                                    <div className="font-mono text-xs font-semibold text-primary">{f.razao_social}</div>
                                    <div className="text-muted-foreground text-xs">{f.cidade}/{f.uf} — {f.tipo}</div>
                                    <div className="text-muted-foreground text-[10px]">{f.contato} • {f.telefone}</div>
                                  </button>
                              )}
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Preço (R$)</Label>
                    <Input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className={yellowInput} placeholder="0,00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={statusKanban} onValueChange={setStatusKanban}>
                      <SelectTrigger className={yellowInput}>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados da Entrada Oficina (editáveis - persiste em recebimento) */}
            <Card>
              <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
                <h3 className="text-sm font-bold tracking-wide text-center">DADOS DA ENTRADA OFICINA</h3>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Data de Entrada da Oficina</Label>
                    <Input
                      type="date"
                      value={entradaOficinaData}
                      onChange={(e) => setEntradaOficinaData(e.target.value)}
                      className={yellowInput}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Qtd Total Recebida</Label>
                    <Input
                      type="number"
                      min="0"
                      value={entradaOficinaQtd != null ? String(entradaOficinaQtd) : ""}
                      onChange={(e) => setEntradaOficinaQtd(e.target.value === "" ? null : Number(e.target.value))}
                      className={yellowInput}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      onClick={handleSalvarEntradaOficina}
                      disabled={savingEntrada || !currentOrdemCorteId}
                      className="bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)] w-full"
                    >
                      {savingEntrada ? "Salvando..." : "Salvar Entrada"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Imagem Referência */}
            <Card className="flex flex-col">
              <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-3 py-1.5 rounded-t-lg">
                <h3 className="text-xs font-bold tracking-wide text-center">IMAGEM REF. </h3>
              </div>
              <CardContent className="p-2 flex-1 flex flex-col items-center justify-center">
                {refImage ?
                <div className="w-full h-full min-h-[200px]">
                    <img src={refImage} alt="Referência do modelo" className="w-full h-full object-contain rounded" />
                  </div> :

                <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                    <ImageOff className="w-10 h-10" />
                    <span className="text-xs">Imagem será carregada ao buscar uma ordem</span>
                  </div>
                }
              </CardContent>
            </Card>
          </div>


          {/* Grade de Tamanhos (consulta only) */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">GRADE DE TAMANHOS</h3>
            </div>
            <CardContent className="p-3">
              {currentOrdemCorteId && (() => {
                const prev = (expedicoesDb || []).filter((e: any) => e.ordem_corte_id === currentOrdemCorteId);
                if (prev.length === 0) return null;
                return (
                  <div className="mb-3 p-2 rounded bg-muted/40 border border-border print-saidas-parciais">
                    <div className="text-[11px] font-semibold mb-1">Saídas parciais já registradas ({prev.length})</div>
                    <ul className="text-[11px] space-y-0.5">
                      {prev.map((e: any) => {
                        const total = (e.grade_expedicao || []).reduce((s: number, g: any) =>
                          s + TAMANHOS.reduce((ss, t) => ss + (g[`${TAM_KEYS[t]}_exp`] || 0), 0), 0);
                        return (
                          <li key={e.id} className="flex justify-between gap-2">
                            <span className="font-mono">{e.data_saida || "—"}</span>
                            <span className="flex-1 truncate">{e.oficina_nome || "—"}</span>
                            <span className="font-semibold">{total} pç</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })()}
              {gradeRows.length === 0 ?
              <div className="py-8 text-center">
                  <Truck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Busque uma ordem para ver a grade de tamanhos.</p>
                </div> :

              <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-2 py-1.5 text-left font-semibold w-20">COR</th>
                        <th className="px-1 py-1.5 text-center font-semibold w-20">TIPO</th>
                        {TAMANHOS.map((t) =>
                      <th key={t} className="px-1 py-1.5 text-center font-semibold w-14">{t}</th>
                      )}
                        <th className="px-2 py-1.5 text-center font-semibold w-16">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeRows.flatMap((row) => {
                      const totalProd = TAMANHOS.reduce((s, t) => s + (row.qtdProduzida[t] || 0), 0);
                      const totalEnviado = TAMANHOS.reduce((s, t) => s + (row.qtdEnviadaAnterior[t] || 0), 0);
                      const totalSaldo = TAMANHOS.reduce((s, t) => s + saldoCell(row, t), 0);
                      const totalEnv = totalEnviarRow(row);
                      return [
                        <tr key={`${row.id}-prod`} className="print-hide-row">
                          <td className="px-2 py-0.5 font-medium align-top" rowSpan={3}>{row.cor}</td>
                          <td className="px-1 py-0.5 text-[10px] text-muted-foreground text-right pr-2">Produzido</td>
                          {TAMANHOS.map((t) =>
                            <td key={t} className="px-1 py-0.5 text-center">
                              <div className="bg-muted rounded px-1 py-0.5 text-center font-mono">{row.qtdProduzida[t] || 0}</div>
                            </td>
                          )}
                          <td className="px-2 py-0.5 text-center font-bold bg-muted rounded">{totalProd}</td>
                        </tr>,
                        <tr key={`${row.id}-env`} className="print-hide-row">
                          <td className="px-1 py-0.5 text-[10px] text-muted-foreground text-right pr-2">Já enviado</td>
                          {TAMANHOS.map((t) =>
                            <td key={t} className="px-1 py-0.5 text-center font-mono text-muted-foreground">{row.qtdEnviadaAnterior[t] || 0}</td>
                          )}
                          <td className="px-2 py-0.5 text-center font-mono text-muted-foreground">{totalEnviado}</td>
                        </tr>,
                        <tr key={`${row.id}-saldo`} className="print-hide-row">
                          <td className="px-1 py-0.5 text-[10px] text-muted-foreground text-right pr-2">Saldo</td>
                          {TAMANHOS.map((t) =>
                            <td key={t} className="px-1 py-0.5 text-center">
                              <div className="bg-[hsl(199,89%,90%)] rounded px-1 py-0.5 text-center font-mono font-semibold text-[hsl(199,89%,25%)]">{saldoCell(row, t)}</div>
                            </td>
                          )}
                          <td className="px-2 py-0.5 text-center font-mono font-semibold text-[hsl(199,89%,25%)]">{totalSaldo}</td>
                        </tr>,
                        <tr key={`${row.id}-enviar`} className="border-b-2">
                          <td className="px-2 py-0.5 font-medium hidden print:table-cell">{row.cor}</td>
                          <td className="px-1 py-0.5 text-[10px] font-semibold text-right pr-2">Quantidade</td>
                          {TAMANHOS.map((t) => {
                            const max = saldoCell(row, t);
                            return (
                              <td key={t} className="px-1 py-0.5 text-center">
                                <Input type="number" min="0" max={max} value={row.qtdEnviar[t]}
                                  onChange={(e) => updateQtdEnviar(row.id, t, e.target.value)}
                                  disabled={max === 0}
                                  className={`h-7 text-xs text-center ${yellowInput}`} placeholder="0" />
                              </td>
                            );
                          })}
                          <td className="px-1 py-0.5 text-center">
                            <Input type="number" min="0" max={totalSaldo}
                              value={totalEnv > 0 ? String(totalEnv) : ""}
                              onChange={(e) => updateRowTotal(row.id, e.target.value)}
                              disabled={totalSaldo === 0}
                              className={`h-7 text-xs text-center font-bold ${yellowInput}`} placeholder="0" />
                          </td>
                        </tr>,
                      ];
                    })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td className="px-2 py-1.5" colSpan={2}>TOTAL ENVIAR</td>
                        {TAMANHOS.map((t) =>
                      <td key={t} className="px-1 py-1.5 text-center">{gradeRows.reduce((s, r) => s + (parseInt(r.qtdEnviar[t]) || 0), 0)}</td>
                      )}
                        <td className="px-2 py-1.5 text-center">{totalEnviarGeral}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              }
            </CardContent>
          </Card>

          {/* Gradação de Aviamentos (consulta from Modelos) */}
          <Card className="print-page-break">
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">GRADAÇÃO DE AVIAMENTOS</h3>
            </div>
            <CardContent className="p-3">
              {gradacaoRows.length === 0 ?
              <p className="text-sm text-muted-foreground text-center py-6">Busque uma ordem para ver a gradação de aviamentos.</p> :

              <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-1.5 text-left font-semibold">Descrição</th>
                        <th className="px-2 py-1.5 text-center font-semibold w-20">Aum. (cm)</th>
                        {TAMANHOS.map((t) =>
                      <th key={t} className="px-1 py-1.5 text-center font-semibold w-14">{t}</th>
                      )}
                      </tr>
                    </thead>
                    <tbody>
                      {gradacaoRows.map((row, idx) =>
                    <tr key={idx} className="border-b">
                          <td className="px-3 py-1.5 font-medium">{row.descricao}</td>
                          <td className="px-2 py-1.5 text-center font-mono">{row.aumentoCm}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.pp}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.p}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.m}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.g}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.gg}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.g1}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.g2}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.g3}</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              }
            </CardContent>
          </Card>

          {/* Aviamentos do Modelo */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">AVIAMENTOS DO MODELO</h3>
            </div>
            <CardContent className="p-3">
              {aviamentosExp.length === 0 ?
              <p className="text-sm text-muted-foreground text-center py-6">Busque uma ordem para ver os aviamentos.</p> :

              <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-1.5 text-left font-semibold">Descrição</th>
                        <th className="px-3 py-1.5 text-left font-semibold w-28">Tipo</th>
                        <th className="px-3 py-1.5 text-center font-semibold w-24">Qtd Modelo</th>
                        <th className="px-3 py-1.5 text-center font-semibold w-28">Qtd Envio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aviamentosExp.map((a) =>
                    <tr key={a.id} className="border-b">
                          <td className="px-3 py-1.5">{a.descricao}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{a.tipo}</td>
                          <td className="px-3 py-1.5 text-center">
                            <span className="bg-muted rounded px-2 py-0.5 font-mono">{a.qtdModelo}</span>
                          </td>
                          <td className="px-1.5 py-1">
                            <Input
                          type="number"
                          min="0"
                          value={a.qtdEnvio}
                          onChange={(e) => updateAviamentoEnvio(a.id, e.target.value)}
                          className={`h-7 text-xs text-center ${yellowInput}`}
                          placeholder="0" />
                        
                          </td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              }
            </CardContent>
          </Card>

          {/* Entretela / Forro / Tecido 2 */}
          {(modeloExtras?.entretela || modeloExtras?.forro_tecido2) && (
            <Card>
              <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
                <h3 className="text-sm font-bold tracking-wide text-center">ENTRETELA / FORRO / TECIDO 2</h3>
              </div>
              <CardContent className="p-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-1.5 text-left font-semibold w-32">Item</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Descrição</th>
                        <th className="px-3 py-1.5 text-center font-semibold w-28">Quantidade</th>
                        <th className="px-3 py-1.5 text-center font-semibold w-32">Consumo p/ peça</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modeloExtras?.entretela && (
                        <tr className="border-b">
                          <td className="px-3 py-1.5 font-medium">Entretela</td>
                          <td className="px-3 py-1.5">{modeloExtras.entretela_descricao || "—"}</td>
                          <td className="px-3 py-1.5 text-center font-mono">{modeloExtras.entretela_quantidade || 0}</td>
                          <td className="px-3 py-1.5 text-center font-mono">{modeloExtras.entretela_consumo_peca ? Number(modeloExtras.entretela_consumo_peca).toFixed(2) : "—"}</td>
                        </tr>
                      )}
                      {modeloExtras?.forro_tecido2 && (
                        <tr className="border-b">
                          <td className="px-3 py-1.5 font-medium">Forro / Tecido 2</td>
                          <td className="px-3 py-1.5">{modeloExtras.forro_tecido2_descricao || "—"}</td>
                          <td className="px-3 py-1.5 text-center font-mono">{modeloExtras.forro_tecido2_quantidade || 0}</td>
                          <td className="px-3 py-1.5 text-center font-mono">{modeloExtras.forro_tecido2_consumo_peca ? Number(modeloExtras.forro_tecido2_consumo_peca).toFixed(2) : "—"}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          <Card>
            <div className="bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">OBSERVAÇÕES</h3>
            </div>
            <CardContent className="p-4 space-y-3">
              {(obsModelo || obsCorte) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-md border bg-muted/40 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Observações do Modelo
                    </div>
                    <div className="text-sm whitespace-pre-wrap min-h-[40px]">
                      {obsModelo || <span className="text-muted-foreground">—</span>}
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/40 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Observações do Corte
                    </div>
                    <div className="text-sm whitespace-pre-wrap min-h-[40px]">
                      {obsCorte || <span className="text-muted-foreground">—</span>}
                    </div>
                  </div>
                </div>
              )}
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className={`${yellowInput} min-h-[80px]`}
                placeholder="Anotações sobre a expedição..." />
              
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);

};

export default ExpedicaoPage;