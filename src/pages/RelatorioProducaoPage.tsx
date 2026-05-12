import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Clock, Package, TrendingUp, Activity, Shirt } from "lucide-react";
import { PedidoTimeline } from "@/components/shared/PedidoTimeline";
import { cn } from "@/lib/utils";

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
  status: string;
  updated_at: string;
}
interface ExpedicaoRow {
  ordem_corte_id: string;
  status: string;
  updated_at: string;
}
interface RecebimentoRow {
  ordem_corte_id: string;
  status: string;
  updated_at: string;
}
interface EntregaRow {
  ordem_corte_id: string;
  status: string;
  updated_at: string;
}

type ColKey = "modelos_pedido" | "corte" | "producao" | "recebimento" | "acabamento";

const kanbanColumns: { key: ColKey; label: string; color: string }[] = [
  { key: "modelos_pedido", label: "Modelos - Pedido", color: "hsl(38 92% 50%)" },
  { key: "corte", label: "Corte", color: "hsl(217 71% 45%)" },
  { key: "producao", label: "Produção", color: "hsl(38 92% 50%)" },
  { key: "recebimento", label: "Recebimento", color: "hsl(199 89% 48%)" },
  { key: "acabamento", label: "Acabamento", color: "hsl(142 71% 35%)" },
];

const colBadgeStyles: Record<ColKey, string> = {
  modelos_pedido: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)] border-[hsl(38_92%_50%/0.3)]",
  corte: "bg-[hsl(217_71%_45%/0.15)] text-[hsl(217,71%,45%)] border-[hsl(217_71%_45%/0.3)]",
  producao: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)] border-[hsl(38_92%_50%/0.3)]",
  recebimento: "bg-[hsl(199_89%_48%/0.15)] text-[hsl(199,89%,48%)] border-[hsl(199_89%_48%/0.3)]",
  acabamento: "bg-[hsl(142_71%_35%/0.15)] text-[hsl(142,71%,35%)] border-[hsl(142_71%_35%/0.3)]",
};

function PedidoCard({
  pedido,
  col,
  imagemUrl,
  onOpenTimeline,
  onOpenFicha,
}: {
  pedido: PedidoRow;
  col: ColKey;
  imagemUrl?: string | null;
  onOpenTimeline: (n: string) => void;
  onOpenFicha: (n: string) => void;
}) {
  const colLabel = kanbanColumns.find((c) => c.key === col)?.label || "";
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onOpenFicha(pedido.numero_pedido)}
            className="shrink-0 w-14 h-14 rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-primary transition"
            title="Abrir ficha do pedido"
          >
            {imagemUrl ? (
              <img src={imagemUrl} alt={pedido.modelo_ref} className="w-full h-full object-cover" />
            ) : (
              <Shirt className="w-6 h-6 text-muted-foreground" />
            )}
          </button>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-primary truncate">{pedido.modelo_ref}</span>
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
              className="text-[11px] text-primary font-mono truncate hover:underline text-left block w-full"
              title="Abrir ficha do pedido"
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
              title="Ver linha do tempo"
            >
              <CalendarDays className="w-3 h-3" />
              {new Date(pedido.data_pedido).toLocaleDateString("pt-BR")}
            </button>
          </div>
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
      fetchAll<OrdemCorteRow & { id: string }>("ordens_corte", "id,numero_pedido,status,updated_at"),
      fetchAll<ExpedicaoRow>("expedicao", "ordem_corte_id,status,updated_at"),
      fetchAll<RecebimentoRow>("recebimento", "ordem_corte_id,status,updated_at"),
      fetchAll<EntregaRow>("entrega_cliente", "ordem_corte_id,status,updated_at"),
      supabase.from("modelos").select("referencia,imagem_url"),
    ]).then(([p, o, e, r, en, m]) => {
      // Pedidos mais recentes primeiro
      setPedidos([...p].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")));
      setOrdens(o);
      setExpedicoes(e);
      setRecebimentos(r);
      setEntregas(en);
      const imgs: Record<string, string> = {};
      (m.data || []).forEach((x: any) => {
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
      if (recs.some((x) => isAndamento(x.status))) {
        map[np] = "recebimento";
        return;
      }
      // EXPEDICAO concluído -> Recebimento
      if (exps.some((x) => isConcluido(x.status))) {
        map[np] = "recebimento";
        return;
      }
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

  const pedidosFiltrados = useMemo(
    () => (filtroCliente === "__all__" ? pedidos : pedidos.filter((p) => (p.cliente || "") === filtroCliente)),
    [pedidos, filtroCliente]
  );

  const grouped = useMemo(() => {
    const g: Record<ColKey, PedidoRow[]> = {
      modelos_pedido: [],
      corte: [],
      producao: [],
      recebimento: [],
      acabamento: [],
    };
    pedidosFiltrados.forEach((p) => {
      const c = colByPedido[p.numero_pedido];
      if (c) g[c].push(p);
    });
    return g;
  }, [pedidosFiltrados, colByPedido]);

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

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Fluxo de Produção"
        description="Kanban de pedidos derivado dos status de Pedido, Corte, Expedição, Recebimento e Entrega"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Package} label="Total de Pedidos" value={String(metrics.total)} />
        <MetricCard icon={Activity} label="Em Fluxo" value={String(metrics.ativos)} hint="visíveis no kanban" />
        <MetricCard icon={Clock} label="Em Acabamento" value={String(metrics.acabamento)} />
        <MetricCard icon={TrendingUp} label="Concluídos" value={String(metrics.ocultos)} hint="entregues ao cliente" />
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 min-w-[240px] flex-1 max-w-sm">
            <label className="text-xs font-semibold text-muted-foreground">Cliente</label>
            <Select value={filtroCliente} onValueChange={setFiltroCliente}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os clientes</SelectItem>
                {clientesOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {filtroCliente !== "__all__" && (
            <Button variant="ghost" size="sm" onClick={() => setFiltroCliente("__all__")}>
              Limpar
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {kanbanColumns.map((col) => (
          <div key={col.key} className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
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
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum pedido</p>
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
