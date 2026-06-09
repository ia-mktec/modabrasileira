import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Download } from "lucide-react";
import { formatDateBR, cn } from "@/lib/utils";
import { PageLoading } from "@/components/shared/PageLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie,
} from "recharts";
import { Scissors, Layers, TrendingUp, Truck, FileText, CheckCircle2 } from "lucide-react";
import { buildAuditWorkbook } from "@/lib/dashboard-audit";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const ETAPA_COLORS: Record<string, string> = {
  "Corte": "hsl(38 92% 50%)",
  "Expedição": "hsl(217 71% 55%)",
  "Oficina": "hsl(280 65% 50%)",
  "Recebimento": "hsl(199 89% 48%)",
  "Acabamento": "hsl(262 60% 55%)",
  "Entregue": "hsl(142 71% 35%)",
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [ordens, setOrdens] = useState<any[]>([]);
  const [tecidos, setTecidos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [expedicoes, setExpedicoes] = useState<any[]>([]);
  const [gradesExp, setGradesExp] = useState<any[]>([]);
  const [recebimentos, setRecebimentos] = useState<any[]>([]);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [expedidasSet, setExpedidasSet] = useState<Set<string>>(new Set());
  const [expedicaoConcluidaSet, setExpedicaoConcluidaSet] = useState<Set<string>>(new Set());
  const [recebidasSet, setRecebidasSet] = useState<Set<string>>(new Set());
  const [recebimentoConcluidoSet, setRecebimentoConcluidoSet] = useState<Set<string>>(new Set());
  const [entreguesSet, setEntreguesSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filtro de período — default: mês atual
  const today = new Date();
  const [dataInicio, setDataInicio] = useState<Date | null>(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [dataFim, setDataFim] = useState<Date | null>(today);

  useEffect(() => {
    const fetchAll = async <T,>(table: string, columns: string, order?: { col: string; asc: boolean }): Promise<T[]> => {
      const PAGE = 1000;
      let from = 0;
      const all: T[] = [];
      while (true) {
        let q: any = supabase.from(table as any).select(columns).range(from, from + PAGE - 1);
        if (order) q = q.order(order.col, { ascending: order.asc });
        const { data, error } = await q;
        if (error || !data) break;
        all.push(...(data as T[]));
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return all;
    };

    (async () => {
      const [oc, tec, expGrade, ped, expRows, recRows, entRows] = await Promise.all([
        fetchAll<any>("ordens_corte", "id,numero,modelo_ref,tecido_nome,quantidade_pecas,data_corte,status", { col: "data_corte", asc: false }),
        fetchAll<any>("tecidos", "id,nome,composicao,cor,estoque_kg,status"),
        fetchAll<any>("grade_expedicao", "expedicao_id,cor,pp_exp,p_exp,m_exp,g_exp,gg_exp,g1_exp,g2_exp,g3_exp"),
        fetchAll<any>("modelo_pedidos", "numero_pedido,cliente,modelo_ref,tecido,cor,data_pedido,status_kanban,created_at"),
        fetchAll<any>("expedicao", "id,ordem_corte_id,data_saida,oficina_nome,preco_peca,status,created_at"),
        fetchAll<any>("recebimento", "id,ordem_corte_id,data_recebimento,oficina_nome,total_sem_defeitos,defeitos,status,created_at"),
        fetchAll<any>("entrega_cliente", "id,ordem_corte_id,data_entrega,qtd_entregue,cliente_id,created_at"),
      ]);
      setOrdens(oc || []);
      setTecidos(tec || []);
      setGradesExp(expGrade || []);
      setPedidos(ped || []);
      setExpedicoes(expRows || []);
      setRecebimentos(recRows || []);
      setEntregas(entRows || []);

      const expedidas = new Set<string>((expRows || []).map((e: any) => e.ordem_corte_id).filter(Boolean));
      const expConcluidas = new Set<string>(
        (expRows || [])
          .filter((e: any) => e.status === "concluido")
          .map((e: any) => e.ordem_corte_id)
          .filter(Boolean)
      );
      const recebidas = new Set<string>((recRows || []).map((r: any) => r.ordem_corte_id).filter(Boolean));
      const recConcluidos = new Set<string>(
        (recRows || [])
          .filter((r: any) => r.status === "concluido")
          .map((r: any) => r.ordem_corte_id)
          .filter(Boolean)
      );
      const entregues = new Set<string>((entRows || []).map((e: any) => e.ordem_corte_id).filter(Boolean));
      setExpedidasSet(expedidas);
      setExpedicaoConcluidaSet(expConcluidas);
      setRecebidasSet(recebidas);
      setRecebimentoConcluidoSet(recConcluidos);
      setEntreguesSet(entregues);

      setLoading(false);
    })();
  }, []);

  const getEtapa = (oc: any): { label: string; color: string } => {
    const id = oc.id;
    let label: string;
    if (entreguesSet.has(id)) label = "Entregue";
    else if (recebimentoConcluidoSet.has(id)) label = "Acabamento";
    else if (recebidasSet.has(id)) label = "Recebimento";
    else if (expedicaoConcluidaSet.has(id)) label = "Oficina";
    else if (expedidasSet.has(id)) label = "Expedição";
    // Alinha com o Kanban: OC concluída (mesmo sem registro em expedicao) já é "Expedição"
    else if (oc.status === "concluido") label = "Expedição";
    else label = "Corte";
    return { label, color: ETAPA_COLORS[label] };
  };

  const inPeriodo = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (dataInicio && d < dataInicio) return false;
    if (dataFim) {
      const f = new Date(dataFim);
      f.setHours(23, 59, 59, 999);
      if (d > f) return false;
    }
    return true;
  };

  const tecidoEstoque = useMemo(
    () => tecidos.reduce((s, t) => s + Number(t.estoque_kg || 0), 0),
    [tecidos],
  );

  // Produção Cortada no Período: OCs com status='concluido' e data_corte no período
  const producaoCortadaPeriodo = useMemo(
    () =>
      ordens
        .filter((o) => o.status === "concluido" && inPeriodo(o.data_corte))
        .reduce((s, o) => s + (o.quantidade_pecas || 0), 0),
    [ordens, dataInicio, dataFim],
  );

  // Produção Finalizada (peças que concluíram acabamento ou foram entregues no período)
  const producaoFinalizadaPeriodo = useMemo(() => {
    // mapa: ocId -> última data de recebimento concluído
    const recMap = new Map<string, string>();
    recebimentos.forEach((r) => {
      if (r.status === "concluido" && r.ordem_corte_id) {
        const d = r.data_recebimento || r.created_at;
        const cur = recMap.get(r.ordem_corte_id);
        if (d && (!cur || new Date(d) > new Date(cur))) recMap.set(r.ordem_corte_id, d);
      }
    });
    const entMap = new Map<string, string>();
    entregas.forEach((e) => {
      if (!e.ordem_corte_id) return;
      const d = e.data_entrega || e.created_at;
      const cur = entMap.get(e.ordem_corte_id);
      if (d && (!cur || new Date(d) > new Date(cur))) entMap.set(e.ordem_corte_id, d);
    });
    let total = 0;
    ordens.forEach((o) => {
      const dE = entMap.get(o.id);
      const dR = recMap.get(o.id);
      let dFin: string | undefined;
      if (dE && (!dR || new Date(dE) >= new Date(dR))) dFin = dE;
      else if (dR) dFin = dR;
      if (dFin && inPeriodo(dFin)) total += (o.quantidade_pecas || 0);
    });
    return total;
  }, [ordens, recebimentos, entregas, dataInicio, dataFim]);

  const pedidosPeriodoCount = useMemo(
    () => pedidos.filter((p) => inPeriodo(p.data_pedido)).length,
    [pedidos, dataInicio, dataFim],
  );

  const expedicoesPeriodo = useMemo(
    () => expedicoes.filter((e) => inPeriodo(e.data_saida || e.created_at)),
    [expedicoes, dataInicio, dataFim],
  );

  const pecasExpedidasPeriodo = useMemo(() => {
    const ids = new Set(expedicoesPeriodo.map((e) => e.id));
    return gradesExp
      .filter((g) => ids.has(g.expedicao_id))
      .reduce(
        (s, g) =>
          s + (g.pp_exp || 0) + (g.p_exp || 0) + (g.m_exp || 0) + (g.g_exp || 0) +
          (g.gg_exp || 0) + (g.g1_exp || 0) + (g.g2_exp || 0) + (g.g3_exp || 0),
        0,
      );
  }, [gradesExp, expedicoesPeriodo]);

  const ordensAbertasPeriodo = useMemo(
    () =>
      expedicoesPeriodo.filter(
        (e) => e.ordem_corte_id && !recebidasSet.has(e.ordem_corte_id),
      ).length,
    [expedicoesPeriodo, recebidasSet],
  );

  const ordensPeriodo = useMemo(
    () => ordens.filter((o) => inPeriodo(o.data_corte)),
    [ordens, dataInicio, dataFim],
  );

  const statusProducao = useMemo(() => {
    const ordemEtapas = [
      "Corte", "Expedição", "Oficina",
      "Recebimento", "Acabamento", "Entregue",
    ];
    const counts: Record<string, number> = {};
    ordensPeriodo.forEach((o) => {
      const e = getEtapa(o).label;
      counts[e] = (counts[e] || 0) + 1;
    });
    const total = ordensPeriodo.length || 1;
    return ordemEtapas
      .filter((k) => counts[k])
      .map((k) => ({
        name: k,
        value: Math.round((counts[k] / total) * 100),
        fill: ETAPA_COLORS[k],
      }));
  }, [ordensPeriodo, expedidasSet, expedicaoConcluidaSet, recebidasSet, recebimentoConcluidoSet, entreguesSet]);

  const producaoMensal = useMemo(() => {
    const ref = dataFim || new Date();
    const meses: { y: number; m: number; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      meses.push({
        y: d.getFullYear(),
        m: d.getMonth(),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      });
    }
    const buckets: Record<string, number> = {};
    ordens.forEach((o) => {
      if (!o.data_corte || o.status !== "concluido") return;
      const d = new Date(o.data_corte);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = (buckets[key] || 0) + (o.quantidade_pecas || 0);
    });
    return meses.map(({ y, m, key }) => {
      const label = new Date(y, m, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      return { mes: label.replace(".", ""), pecas: buckets[key] || 0 };
    });
  }, [ordens, dataFim]);

  const ultimasOrdens = ordensPeriodo.slice(0, 6);

  const kpiCards = [
    // Primeira linha
    {
      title: t("dashboard.kpi.pedidosPeriodo"),
      value: pedidosPeriodoCount.toLocaleString("pt-BR"),
      subtitle: t("dashboard.kpi.pedidosPeriodoSub"),
      icon: FileText,
    },
    {
      title: t("dashboard.kpi.ordensAbertas"),
      value: ordensAbertasPeriodo.toString(),
      subtitle: t("dashboard.kpi.ordensAbertasSub"),
      icon: TrendingUp,
    },
    {
      title: t("dashboard.kpi.tecidoEstoque"),
      value: `${tecidoEstoque.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mt`,
      subtitle: t("dashboard.kpi.tecidoEstoqueSub"),
      icon: Layers,
    },
    // Segunda linha
    {
      title: t("dashboard.kpi.producaoCortada"),
      value: producaoCortadaPeriodo.toLocaleString("pt-BR"),
      subtitle: t("dashboard.kpi.producaoCortadaSub"),
      icon: Scissors,
    },
    {
      title: t("dashboard.kpi.pecasExpedidas"),
      value: pecasExpedidasPeriodo.toLocaleString("pt-BR"),
      subtitle: t("dashboard.kpi.pecasExpedidasSub"),
      icon: Truck,
    },
    {
      title: t("dashboard.kpi.producaoPeriodo"),
      value: producaoFinalizadaPeriodo.toLocaleString("pt-BR"),
      subtitle: t("dashboard.kpi.producaoPeriodoSub"),
      icon: CheckCircle2,
    },
  ];

  const aplicarPreset = (preset: "mes" | "30d" | "6m" | "tudo") => {
    const hoje = new Date();
    if (preset === "mes") {
      setDataInicio(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
      setDataFim(hoje);
    } else if (preset === "30d") {
      const ini = new Date();
      ini.setDate(ini.getDate() - 30);
      setDataInicio(ini);
      setDataFim(hoje);
    } else if (preset === "6m") {
      setDataInicio(new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1));
      setDataFim(hoje);
    } else {
      setDataInicio(null);
      setDataFim(null);
    }
  };

  const handleExport = () => {
    try {
      buildAuditWorkbook(
        { inicio: dataInicio, fim: dataFim },
        {
          ordens,
          expedicoes,
          gradesExp,
          recebimentos,
          entregas,
          tecidos,
          pedidos,
          expedidasSet,
          expedicaoConcluidaSet,
          recebidasSet,
          recebimentoConcluidoSet,
          entreguesSet,
        },
      );
      toast({ title: t("dashboard.exportSuccess"), description: t("dashboard.exportSuccessDescription") });
    } catch (e: any) {
      toast({ title: t("dashboard.exportError"), description: e?.message || t("dashboard.exportErrorUnknown"), variant: "destructive" });
    }
  };

  if (loading) {
    return <PageLoading message={t("dashboard.loading")} />;
  }

  const DateBtn = ({ value, onChange, placeholder }: { value: Date | null; onChange: (d: Date | null) => void; placeholder: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-1" />
          {value ? format(value, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value || undefined} onSelect={(d) => onChange(d || null)} initialFocus className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader title={t("dashboard.title")} description={t("dashboard.description")}>
        <div className="flex flex-wrap items-center gap-2">
          <DateBtn value={dataInicio} onChange={setDataInicio} placeholder={t("common.start")} />
          <DateBtn value={dataFim} onChange={setDataFim} placeholder={t("common.end")} />
          <Button size="sm" variant="ghost" onClick={() => aplicarPreset("mes")}>{t("dashboard.presets.mes")}</Button>
          <Button size="sm" variant="ghost" onClick={() => aplicarPreset("30d")}>{t("dashboard.presets.30d")}</Button>
          <Button size="sm" variant="ghost" onClick={() => aplicarPreset("6m")}>{t("dashboard.presets.6m")}</Button>
          <Button size="sm" variant="ghost" onClick={() => aplicarPreset("tudo")}>{t("dashboard.presets.tudo")}</Button>
          <Button size="sm" onClick={handleExport}>
            <Download /> {t("common.export")}
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "—" : kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.chart.producaoMensal")}</CardTitle>
          </CardHeader>
          <CardContent>
            {producaoMensal.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t("dashboard.chart.semDados")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={producaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 88%)" />
                  <XAxis dataKey="mes" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR")} />
                  <Bar dataKey="pecas" fill="hsl(217 71% 55%)" radius={[4, 4, 0, 0]} name={t("dashboard.chart.pecas")} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.chart.statusOrdens")}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusProducao.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t("dashboard.chart.semOrdens")}</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusProducao} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {statusProducao.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {statusProducao.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-muted-foreground">{t(`dashboard.etapa.${item.name}`, { defaultValue: item.name })} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.ultimasOrdens")}</CardTitle>
        </CardHeader>
        <CardContent>
          {ultimasOrdens.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("dashboard.table.semOrdens")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-6 font-medium">{t("dashboard.table.numero")}</th>
                    <th className="text-left py-2 pr-6 font-medium">{t("dashboard.table.modelo")}</th>
                    <th className="text-left py-2 pr-6 font-medium">{t("dashboard.table.tecido")}</th>
                    <th className="text-right py-2 pr-8 font-medium">{t("dashboard.table.quantidade")}</th>
                    <th className="text-left py-2 pr-6 font-medium">{t("dashboard.table.data")}</th>
                    <th className="text-left py-2 font-medium">{t("dashboard.table.etapa")}</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasOrdens.map((oc) => {
                    const etapa = getEtapa(oc);
                    return (
                    <tr key={oc.id} className="border-b last:border-0">
                      <td className="py-2.5 font-mono text-xs">{oc.numero}</td>
                      <td className="py-2.5">{oc.modelo_ref || "—"}</td>
                      <td className="py-2.5">{oc.tecido_nome || "—"}</td>
                      <td className="py-2.5 text-right">{(oc.quantidade_pecas || 0).toLocaleString("pt-BR")}</td>
                      <td className="py-2.5">{formatDateBR(oc.data_corte)}</td>
                      <td className="py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${etapa.color}1f`, color: etapa.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: etapa.color }} />
                          {t(`dashboard.etapa.${etapa.label}`, { defaultValue: etapa.label })}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
