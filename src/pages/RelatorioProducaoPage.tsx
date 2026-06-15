import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoading } from "@/components/shared/PageLoading";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CalendarDays, Clock, Package, TrendingUp, Activity, Shirt, Search, FileSpreadsheet, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { PedidoTimeline } from "@/components/shared/PedidoTimeline";
import { cn, formatDateBR } from "@/lib/utils";

interface PedidoRow {
  numero_pedido: string;
  modelo_ref: string;
  cliente: string | null;
  tecido: string | null;
  cor: string | null;
  status_kanban: string;
  data_pedido: string;
  created_at: string;
  updated_at: string;
}

interface OrdemCorteRow {
  numero_pedido: string | null;
  numero: string;
  status: string;
  updated_at: string;
}
interface ExpedicaoRow {
  ordem_corte_id: string;
  status: string;
  updated_at: string;
  data_saida: string | null;
  oficina_nome: string | null;
}
interface RecebimentoRow {
  ordem_corte_id: string;
  status: string;
  updated_at: string;
  data_recebimento: string | null;
  total_sem_defeitos: number | null;
  segunda_qualidade: number | null;
}
interface EntregaRow {
  ordem_corte_id: string;
  status: string;
  updated_at: string;
}

type ColKey = "modelos_pedido" | "corte" | "producao" | "oficina_costura" | "recebimento" | "acabamento";

const kanbanColumns: { key: ColKey; color: string }[] = [
  { key: "modelos_pedido", color: "hsl(38 92% 50%)" },
  { key: "corte", color: "hsl(217 71% 45%)" },
  { key: "producao", color: "hsl(38 92% 50%)" },
  { key: "oficina_costura", color: "hsl(280 65% 50%)" },
  { key: "recebimento", color: "hsl(199 89% 48%)" },
  { key: "acabamento", color: "hsl(142 71% 35%)" },
];

const colBadgeStyles: Record<ColKey, string> = {
  modelos_pedido: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)] border-[hsl(38_92%_50%/0.3)]",
  corte: "bg-[hsl(217_71%_45%/0.15)] text-[hsl(217,71%,45%)] border-[hsl(217_71%_45%/0.3)]",
  producao: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)] border-[hsl(38_92%_50%/0.3)]",
  oficina_costura: "bg-[hsl(280_65%_50%/0.15)] text-[hsl(280,65%,50%)] border-[hsl(280_65%_50%/0.3)]",
  recebimento: "bg-[hsl(199_89%_48%/0.15)] text-[hsl(199,89%,48%)] border-[hsl(199_89%_48%/0.3)]",
  acabamento: "bg-[hsl(142_71%_35%/0.15)] text-[hsl(142,71%,35%)] border-[hsl(142_71%_35%/0.3)]",
};

function PedidoCard({
  pedido,
  col,
  imagemUrl,
  onOpenTimeline,
  onOpenFicha,
  numeroOrdemCorte,
}: {
  pedido: PedidoRow;
  col: ColKey;
  imagemUrl?: string | null;
  onOpenTimeline: (n: string) => void;
  onOpenFicha: (n: string) => void;
  numeroOrdemCorte?: string | null;
}) {
  const { t } = useTranslation();
  const { roles } = useAuth();
  const isGestao = roles.includes("gestao") || roles.includes("dev");
  const colLabel = t(`reports.producao.columns.${col}`);
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex justify-end mb-2">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap",
              colBadgeStyles[col]
            )}
          >
            {colLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onOpenFicha(pedido.numero_pedido)}
          className="w-full aspect-square rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-primary transition mb-2"
          title={t("reports.producao.card.abrirFicha")}
        >
          {imagemUrl ? (
            <img src={imagemUrl} alt={pedido.modelo_ref} className="w-full h-full object-cover" />
          ) : (
            <Shirt className="w-10 h-10 text-muted-foreground" />
          )}
        </button>
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-xs font-semibold text-primary truncate">{pedido.modelo_ref}</span>
            {numeroOrdemCorte && (
              isGestao ? (
                <Link
                  to={`/ficha-gestor/${encodeURIComponent(pedido.numero_pedido)}`}
                  className="text-[10px] text-primary truncate hover:underline block"
                >
                  {t("reports.producao.card.ocPrefix")} {numeroOrdemCorte}
                </Link>
              ) : (
                <span className="text-[10px] text-muted-foreground truncate">{t("reports.producao.card.ocPrefix")} {numeroOrdemCorte}</span>
              )
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenFicha(pedido.numero_pedido)}
            className="text-[11px] text-primary font-mono truncate hover:underline text-left block w-full"
            title={t("reports.producao.card.abrirFicha")}
          >
            {pedido.numero_pedido}
          </button>
          {pedido.cliente && <p className="text-xs text-foreground truncate">{pedido.cliente}</p>}
          {(pedido.tecido || pedido.cor) && (
            <p className="text-[11px] text-muted-foreground truncate">
              {[pedido.tecido, pedido.cor].filter(Boolean).join(" • ")}
            </p>
          )}
          <button
            type="button"
            onClick={() => onOpenTimeline(pedido.numero_pedido)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1 border-t border-border w-full hover:text-foreground transition"
            title={t("reports.producao.card.verTimeline")}
          >
            <CalendarDays className="w-3 h-3" />
            {formatDateBR(pedido.data_pedido)}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
          </div>
          <Icon className="w-8 h-8 text-primary opacity-70" />
        </div>
      </CardContent>
    </Card>
  );
}

const norm = (s?: string | null) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isAndamento = (s?: string | null) => {
  const n = norm(s);
  return n === "em_andamento" || n === "em andamento" || n === "andamento" || n === "pendente";
};
const isConcluido = (s?: string | null) => {
  const n = norm(s);
  return n === "concluido" || n === "concluida" || n === "entregue" || n === "finalizado";
};
const isCancelado = (s?: string | null) => norm(s) === "cancelado";

const RelatorioProducaoPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [ordens, setOrdens] = useState<(OrdemCorteRow & { id: string })[]>([]);
  const [expedicoes, setExpedicoes] = useState<ExpedicaoRow[]>([]);
  const [recebimentos, setRecebimentos] = useState<RecebimentoRow[]>([]);
  const [entregas, setEntregas] = useState<EntregaRow[]>([]);
  const [modeloImgs, setModeloImgs] = useState<Record<string, string>>({});
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState<string>("__all__");
  const [filtroOC, setFiltroOC] = useState<string>("");

  useEffect(() => {
    // Helper para paginar tabelas que podem exceder 1000 linhas (limite padrão do Supabase)
    const fetchAll = async <T,>(table: string, columns: string): Promise<T[]> => {
      const PAGE = 1000;
      let from = 0;
      const all: T[] = [];
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabase.from(table as any).select(columns).range(from, from + PAGE - 1);
        if (error || !data) break;
        all.push(...(data as T[]));
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return all;
    };

    Promise.all([
      fetchAll<PedidoRow>("modelo_pedidos", "*"),
      fetchAll<OrdemCorteRow & { id: string; modelo_ref: string | null; tecido_nome: string | null; cliente_id: string | null; data_corte: string | null; created_at: string; quantidade_pecas: number | null }>("ordens_corte", "id,numero,numero_pedido,status,updated_at,modelo_ref,tecido_nome,cliente_id,data_corte,created_at,quantidade_pecas"),
      fetchAll<ExpedicaoRow>("expedicao", "ordem_corte_id,status,updated_at,data_saida,oficina_nome"),
      fetchAll<RecebimentoRow>("recebimento", "ordem_corte_id,status,updated_at,data_recebimento,total_sem_defeitos,segunda_qualidade"),
      fetchAll<EntregaRow>("entrega_cliente", "ordem_corte_id,status,updated_at"),
      fetchAll<{ referencia: string; imagem_url: string | null }>("modelos", "referencia,imagem_url"),
      fetchAll<{ id: string; razao_social: string }>("clientes", "id,razao_social"),
    ]).then(([p, o, e, r, en, m, cls]) => {
      // Sintetiza pedidos para OCs criadas manualmente sem registro em modelo_pedidos
      const pedidosByNumero = new Set(p.map((x) => x.numero_pedido));
      const clienteById: Record<string, string> = {};
      (cls || []).forEach((c: any) => { if (c?.id) clienteById[c.id] = c.razao_social; });
      const sintetizados: PedidoRow[] = [];
      o.forEach((oc: any) => {
        if (!oc.numero_pedido || pedidosByNumero.has(oc.numero_pedido)) return;
        sintetizados.push({
          numero_pedido: oc.numero_pedido,
          modelo_ref: oc.modelo_ref || "",
          cliente: oc.cliente_id ? (clienteById[oc.cliente_id] || null) : null,
          tecido: oc.tecido_nome || null,
          cor: null,
          status_kanban: "pendente",
          data_pedido: oc.data_corte || oc.created_at,
          created_at: oc.created_at,
          updated_at: oc.updated_at,
        });
        pedidosByNumero.add(oc.numero_pedido);
      });
      const todos = [...p, ...sintetizados];
      setPedidos(todos.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")));
      setOrdens(o);
      setExpedicoes(e);
      setRecebimentos(r);
      setEntregas(en);
      const imgs: Record<string, string> = {};
      (m || []).forEach((x: any) => {
        if (x.referencia && x.imagem_url) imgs[x.referencia] = x.imagem_url;
      });
      setModeloImgs(imgs);
    });
  }, []);

  // Mapeia ordem_corte_id -> numero_pedido para propagar status das etapas seguintes
  const ordemToPedido = useMemo(() => {
    const m: Record<string, string> = {};
    ordens.forEach((o) => {
      if (o.numero_pedido) m[o.id] = o.numero_pedido;
    });
    return m;
  }, [ordens]);

  // Para cada pedido calcula a coluna do kanban (ou null = não aparece)
  const colByPedido = useMemo(() => {
    const map: Record<string, ColKey | null> = {};

    // Indexa por numero_pedido
    const ordensByPed: Record<string, OrdemCorteRow[]> = {};
    ordens.forEach((o) => {
      if (!o.numero_pedido) return;
      (ordensByPed[o.numero_pedido] ||= []).push(o);
    });
    const expByPed: Record<string, ExpedicaoRow[]> = {};
    expedicoes.forEach((x) => {
      const np = ordemToPedido[x.ordem_corte_id];
      if (np) (expByPed[np] ||= []).push(x);
    });
    const recByPed: Record<string, RecebimentoRow[]> = {};
    recebimentos.forEach((x) => {
      const np = ordemToPedido[x.ordem_corte_id];
      if (np) (recByPed[np] ||= []).push(x);
    });
    const entByPed: Record<string, EntregaRow[]> = {};
    entregas.forEach((x) => {
      const np = ordemToPedido[x.ordem_corte_id];
      if (np) (entByPed[np] ||= []).push(x);
    });

    pedidos.forEach((p) => {
      const np = p.numero_pedido;
      if (p.status_kanban === "inativo") {
        map[np] = null;
        return;
      }
      const ents = entByPed[np] || [];
      const recs = recByPed[np] || [];
      const exps = expByPed[np] || [];
      const ocs = ordensByPed[np] || [];

      // ENTREGA — concluído oculta o pedido
      if (ents.some(isConcluidoStatus)) {
        map[np] = null;
        return;
      }
      if (ents.some((x) => isAndamento(x.status))) {
        map[np] = "acabamento";
        return;
      }
      // RECEBIMENTO concluído -> Acabamento
      if (recs.some((x) => isConcluido(x.status))) {
        map[np] = "acabamento";
        return;
      }
      // RECEBIMENTO com Data de Entrada Oficina e Qtd Total Recebida preenchidos -> Recebimento
      if (recs.some((x) => !!x.data_recebimento && (((x.total_sem_defeitos || 0) + (x.segunda_qualidade || 0)) > 0))) {
        map[np] = "recebimento";
        return;
      }
      if (recs.some((x) => isAndamento(x.status))) {
        map[np] = "recebimento";
        return;
      }
      // EXPEDICAO concluído -> Oficina de Costura
      if (exps.some((x) => isConcluido(x.status))) {
        map[np] = "oficina_costura";
        return;
      }
      // EXPEDICAO em andamento ou pendente -> Expedição
      if (exps.some((x) => isAndamento(x.status))) {
        map[np] = "producao";
        return;
      }
      // ORDEM DE CORTE concluído -> Produção
      if (ocs.some((x) => isConcluido(x.status))) {
        map[np] = "producao";
        return;
      }
      if (ocs.some((x) => isAndamento(x.status) || isCancelado(x.status))) {
        map[np] = "corte";
        return;
      }
      // PEDIDO concluído -> Corte
      if (isConcluido(p.status_kanban)) {
        map[np] = "corte";
        return;
      }
      // Default: Modelos - Pedido (em andamento / pendente)
      map[np] = "modelos_pedido";
    });

    return map;

    function isConcluidoStatus(x: { status: string }) {
      return isConcluido(x.status);
    }
  }, [pedidos, ordens, expedicoes, recebimentos, entregas, ordemToPedido]);

  const ordemNumeroByPedido = useMemo(() => {
    const m: Record<string, string> = {};
    ordens.forEach((o) => {
      if (o.numero_pedido && o.numero && !m[o.numero_pedido]) {
        m[o.numero_pedido] = o.numero;
      }
    });
    return m;
  }, [ordens]);

  const clientesOptions = useMemo(() => {
    const set = new Set<string>();
    pedidos.forEach((p) => p.cliente && set.add(p.cliente));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [pedidos]);

  const ocsByPedido = useMemo(() => {
    const m: Record<string, string[]> = {};
    ordens.forEach((o) => {
      if (o.numero_pedido && o.numero) {
        (m[o.numero_pedido] ||= []).push(o.numero);
      }
    });
    return m;
  }, [ordens]);

  const pedidosFiltrados = useMemo(() => {
    const q = norm(filtroOC);
    return pedidos.filter((p) => {
      if (filtroCliente !== "__all__" && (p.cliente || "") !== filtroCliente) return false;
      if (q) {
        const ocs = ocsByPedido[p.numero_pedido] || [];
        const matchOC = ocs.some((n) => norm(n).includes(q));
        const matchPedido = norm(p.numero_pedido).includes(q);
        const matchModelo = norm(p.modelo_ref).includes(q);
        const matchCliente = norm(p.cliente).includes(q);
        if (!matchOC && !matchPedido && !matchModelo && !matchCliente) return false;
      }
      return true;
    });
  }, [pedidos, filtroCliente, filtroOC, ocsByPedido]);

  const grouped = useMemo(() => {
    const g: Record<ColKey, PedidoRow[]> = {
      modelos_pedido: [],
      corte: [],
      producao: [],
      oficina_costura: [],
      recebimento: [],
      acabamento: [],
    };
    const limite45 = Date.now() - 45 * 24 * 60 * 60 * 1000;
    const buscaAtiva = !!filtroOC.trim() || filtroCliente !== "__all__";
    pedidosFiltrados.forEach((p) => {
      const c = colByPedido[p.numero_pedido];
      if (!c) return;
      if (!buscaAtiva && c === "corte" && p.data_pedido) {
        const t = new Date(p.data_pedido).getTime();
        if (!isNaN(t) && t < limite45) return;
      }
      g[c].push(p);

    });
    return g;
  }, [pedidosFiltrados, colByPedido, filtroOC, filtroCliente]);

  const metrics = useMemo(() => {
    const visiveis = pedidosFiltrados.filter((p) => colByPedido[p.numero_pedido]);
    const total = pedidosFiltrados.length;
    const ativos = visiveis.length;
    const acabamento = grouped.acabamento.length;
    const ocultos = total - ativos;
    return { total, ativos, acabamento, ocultos };
  }, [pedidosFiltrados, colByPedido, grouped]);

  const handleClick = (numero: string) => {
    setSelectedPedido(numero);
    setDialogOpen(true);
  };

  const kanbanRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const exportExcel = () => {
    try {
      const rows: any[] = [];
      kanbanColumns.forEach((col) => {
        const fase = t(`reports.producao.columns.${col.key}`);
        grouped[col.key].forEach((p) => {
          rows.push({
            "Fase": fase,
            "Nº Pedido": p.numero_pedido,
            "Nº Ordem de Corte": ordemNumeroByPedido[p.numero_pedido] || "",
            "Referência": p.modelo_ref,
            "Cliente": p.cliente || "",
            "Tecido": p.tecido || "",
            "Cor": p.cor || "",
            "Data do Pedido": p.data_pedido ? formatDateBR(p.data_pedido) : "",
            "Status Kanban": p.status_kanban,
          });
        });
      });
      if (!rows.length) {
        toast.warning("Nenhum dado para exportar");
        return;
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 28 },
        { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 16 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fluxo de Produção");
      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `fluxo-producao-${stamp}.xlsx`);
      toast.success("Excel exportado");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao exportar Excel");
    }
  };

  const exportPDF = async () => {
    if (!kanbanRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(kanbanRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: kanbanRef.current.scrollWidth,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const availW = pageW - margin * 2;
      const ratio = canvas.height / canvas.width;
      const imgW = availW;
      const imgH = availW * ratio;
      if (imgH <= pageH - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, imgW, imgH);
      } else {
        // pagina em fatias
        const pageContentH = pageH - margin * 2;
        const sliceCanvasH = (pageContentH / imgH) * canvas.height;
        let renderedH = 0;
        while (renderedH < canvas.height) {
          const sliceH = Math.min(sliceCanvasH, canvas.height - renderedH);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.drawImage(canvas, 0, renderedH, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          const sliceData = sliceCanvas.toDataURL("image/png");
          const sliceImgH = (sliceH / canvas.width) * availW;
          if (renderedH > 0) pdf.addPage("a4", "landscape");
          pdf.addImage(sliceData, "PNG", margin, margin, availW, sliceImgH);
          renderedH += sliceH;
        }
      }
      const stamp = new Date().toISOString().slice(0, 10);
      pdf.save(`fluxo-producao-${stamp}.pdf`);
      toast.success("PDF exportado");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao exportar PDF");
    } finally {
      setExporting(false);
    }
  };

  if (pedidos.length === 0 && ordens.length === 0) {
    return <PageLoading message={t("reports.producao.loading")} />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("reports.producao.title")}
        description={t("reports.producao.description")}
      >
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Excel
        </Button>
        <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting}>
          <FileDown className="w-4 h-4" />
          {exporting ? "Gerando PDF..." : "Exportar PDF"}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Package} label={t("reports.producao.metrics.total")} value={String(metrics.total)} />
        <MetricCard icon={Activity} label={t("reports.producao.metrics.ativos")} value={String(metrics.ativos)} hint={t("reports.producao.metrics.ativosHint")} />
        <MetricCard icon={Clock} label={t("reports.producao.metrics.acabamento")} value={String(metrics.acabamento)} />
        <MetricCard icon={TrendingUp} label={t("reports.producao.metrics.concluidos")} value={String(metrics.ocultos)} hint={t("reports.producao.metrics.concluidosHint")} />
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 min-w-[240px] flex-1 max-w-sm">
            <label className="text-xs font-semibold text-muted-foreground">{t("reports.producao.filters.cliente")}</label>
            <Select value={filtroCliente} onValueChange={setFiltroCliente}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t("reports.producao.filters.todosClientes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("reports.producao.filters.todosClientes")}</SelectItem>
                {clientesOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 min-w-[200px] flex-1 max-w-sm">
            <label className="text-xs font-semibold text-muted-foreground">{t("reports.producao.filters.ordemCorte")}</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={filtroOC}
                onChange={(e) => setFiltroOC(e.target.value)}
                placeholder={t("reports.producao.filters.buscarOC")}
                className="h-9 pl-8"
              />
            </div>
          </div>
          {(filtroCliente !== "__all__" || filtroOC) && (
            <Button variant="ghost" size="sm" onClick={() => { setFiltroCliente("__all__"); setFiltroOC(""); }}>
              {t("reports.producao.filters.limpar")}
            </Button>
          )}
        </CardContent>
      </Card>

      <div ref={kanbanRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 bg-background p-2">
        {kanbanColumns.map((col) => (
          <div key={col.key} className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="text-sm font-semibold text-foreground">{t(`reports.producao.columns.${col.key}`)}</h3>
              <Badge variant="secondary" className="ml-auto text-[10px] h-5">
                {grouped[col.key].length}
              </Badge>
            </div>
            <div className="flex-1 rounded-lg bg-muted/30 border border-border p-2 min-h-[400px]">
              {grouped[col.key].length ? (
                grouped[col.key].map((p) => (
                  <PedidoCard
                    key={p.numero_pedido}
                    pedido={p}
                    col={col.key}
                    imagemUrl={modeloImgs[p.modelo_ref]}
                    onOpenTimeline={handleClick}
                    onOpenFicha={(n) => navigate(`/pedidos/${encodeURIComponent(n)}/ficha`)}
                    numeroOrdemCorte={ordemNumeroByPedido[p.numero_pedido] || null}
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">{t("reports.producao.empty")}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <PedidoTimeline numeroPedido={selectedPedido} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default RelatorioProducaoPage;
