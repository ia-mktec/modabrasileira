import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Package, TrendingUp, Activity } from "lucide-react";
import { PedidoTimeline } from "@/components/shared/PedidoTimeline";

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

interface HistRow {
  numero_pedido: string;
  status_anterior: string | null;
  status_novo: string;
  created_at: string;
}

const kanbanColumns = [
  { key: "pendente", label: "Modelos - Pedido", color: "hsl(38 92% 50%)" },
  { key: "em_corte", label: "Corte", color: "hsl(217 71% 45%)" },
  { key: "em_producao", label: "Em Produção", color: "hsl(38 92% 50%)" },
  { key: "recebido", label: "Recebimento", color: "hsl(199 89% 48%)" },
  { key: "entregue", label: "Acabamento", color: "hsl(142 71% 35%)" },
];

function PedidoCard({ pedido, onClick }: { pedido: PedidoRow; onClick: (n: string) => void }) {
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onClick(pedido.numero_pedido)}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-primary">{pedido.modelo_ref}</span>
          <StatusBadge status={pedido.status_kanban} />
        </div>
        <p className="text-[11px] text-muted-foreground font-mono truncate">{pedido.numero_pedido}</p>
        {pedido.cliente && <p className="text-xs text-foreground truncate">{pedido.cliente}</p>}
        {(pedido.tecido || pedido.cor) && (
          <p className="text-[11px] text-muted-foreground truncate">
            {[pedido.tecido, pedido.cor].filter(Boolean).join(" • ")}
          </p>
        )}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1 border-t border-border">
          <CalendarDays className="w-3 h-3" />
          {new Date(pedido.data_pedido).toLocaleDateString("pt-BR")}
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

const RelatorioProducaoPage = () => {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [historico, setHistorico] = useState<HistRow[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    supabase.from("modelo_pedidos").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setPedidos(data || []));
    supabase.from("pedido_historico").select("numero_pedido,status_anterior,status_novo,created_at")
      .order("created_at", { ascending: true })
      .then(({ data }) => setHistorico((data || []) as HistRow[]));
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, PedidoRow[]> = {};
    kanbanColumns.forEach((c) => (g[c.key] = []));
    pedidos.forEach((p) => {
      const key = g[p.status_kanban] ? p.status_kanban : "pendente";
      g[key].push(p);
    });
    return g;
  }, [pedidos]);

  // Métricas
  const metrics = useMemo(() => {
    const total = pedidos.length;
    const ativos = pedidos.filter((p) => p.status_kanban !== "entregue").length;
    const entregues = pedidos.filter((p) => p.status_kanban === "entregue").length;

    // Tempo médio entre etapas (em horas) — somente pedidos com transição
    // Agrupa histórico por pedido e ordena
    const porPedido: Record<string, HistRow[]> = {};
    historico.forEach((h) => {
      if (!porPedido[h.numero_pedido]) porPedido[h.numero_pedido] = [];
      porPedido[h.numero_pedido].push(h);
    });

    const duracoes: Record<string, number[]> = {};
    Object.values(porPedido).forEach((hs) => {
      for (let i = 1; i < hs.length; i++) {
        const from = hs[i].status_anterior || "pendente";
        const dt = (new Date(hs[i].created_at).getTime() - new Date(hs[i - 1].created_at).getTime()) / 3600000;
        if (!duracoes[from]) duracoes[from] = [];
        duracoes[from].push(dt);
      }
    });

    const mediaPorEtapa: Record<string, number> = {};
    Object.entries(duracoes).forEach(([k, arr]) => {
      mediaPorEtapa[k] = arr.reduce((s, v) => s + v, 0) / arr.length;
    });

    // Throughput últimos 30d — entregas
    const ms30 = 30 * 24 * 3600 * 1000;
    const cutoff = Date.now() - ms30;
    const entregasUltimos30 = historico.filter(
      (h) => h.status_novo === "entregue" && new Date(h.created_at).getTime() >= cutoff
    ).length;

    return { total, ativos, entregues, mediaPorEtapa, entregasUltimos30 };
  }, [pedidos, historico]);

  const handleClick = (numero: string) => {
    setSelectedPedido(numero);
    setDialogOpen(true);
  };

  const fmtHoras = (h: number) => {
    if (!h || isNaN(h)) return "—";
    if (h < 24) return `${h.toFixed(1)}h`;
    return `${(h / 24).toFixed(1)}d`;
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Fluxo de Produção"
        description="Kanban e métricas de pedidos em produção"
      />

      {/* Dashboard de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Package} label="Total de Pedidos" value={String(metrics.total)} />
        <MetricCard icon={Activity} label="Em Andamento" value={String(metrics.ativos)} />
        <MetricCard icon={TrendingUp} label="Entregues (30d)" value={String(metrics.entregasUltimos30)} hint="últimos 30 dias" />
        <MetricCard icon={Clock} label="Tempo Médio Corte" value={fmtHoras(metrics.mediaPorEtapa["em_corte"] || 0)} hint="em_corte → em_producao" />
      </div>

      {/* Tempo médio por etapa - detalhe */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-3">Tempo médio entre etapas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { from: "pendente", to: "em_corte" },
              { from: "em_corte", to: "em_producao" },
              { from: "em_producao", to: "recebido" },
              { from: "recebido", to: "entregue" },
            ].map((t) => (
              <div key={t.from} className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground">{t.from} → {t.to}</p>
                <p className="text-lg font-bold mt-1">{fmtHoras(metrics.mediaPorEtapa[t.from] || 0)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {kanbanColumns.map((col) => (
          <div key={col.key} className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
              <Badge variant="secondary" className="ml-auto text-[10px] h-5">
                {grouped[col.key]?.length || 0}
              </Badge>
            </div>
            <div className="flex-1 rounded-lg bg-muted/30 border border-border p-2 min-h-[400px]">
              {grouped[col.key]?.length ? (
                grouped[col.key].map((p) => (
                  <PedidoCard key={p.numero_pedido} pedido={p} onClick={handleClick} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum pedido</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <PedidoTimeline
        numeroPedido={selectedPedido}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default RelatorioProducaoPage;
