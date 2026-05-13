import { useEffect, useMemo, useState } from "react";
import { PageLoading } from "@/components/shared/PageLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie,
} from "recharts";
import { Scissors, Layers, TrendingUp, Package, Truck } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pendente: "hsl(38 92% 50%)",
  em_andamento: "hsl(217 71% 55%)",
  concluido: "hsl(142 71% 35%)",
  cancelado: "hsl(0 72% 51%)",
};

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const Dashboard = () => {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [tecidoEstoque, setTecidoEstoque] = useState(0);
  const [pecasExpedidas, setPecasExpedidas] = useState(0);
  const [aviamentosCount, setAviamentosCount] = useState(0);
  const [ordensAbertas, setOrdensAbertas] = useState(0);
  const [expedidasSet, setExpedidasSet] = useState<Set<string>>(new Set());
  const [recebidasSet, setRecebidasSet] = useState<Set<string>>(new Set());
  const [entreguesSet, setEntreguesSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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
      const [oc, tec, expGrade, av, expIds, recIds, entIds] = await Promise.all([
        fetchAll<any>("ordens_corte", "id,numero,modelo_ref,tecido_nome,quantidade_pecas,data_corte,status", { col: "data_corte", asc: false }),
        supabase.from("tecidos").select("estoque_kg"),
        fetchAll<any>("grade_expedicao", "pp_exp,p_exp,m_exp,g_exp,gg_exp,g1_exp,g2_exp,g3_exp"),
        supabase.from("aviamentos").select("id", { count: "exact", head: true }),
        fetchAll<any>("expedicao", "ordem_corte_id"),
        fetchAll<any>("recebimento", "ordem_corte_id"),
        fetchAll<any>("entrega_cliente", "ordem_corte_id"),
      ]);
      setOrdens(oc || []);
      setTecidoEstoque((tec.data || []).reduce((s, t: any) => s + Number(t.estoque_kg || 0), 0));
      setPecasExpedidas((expGrade.data || []).reduce((s, g: any) =>
        s + (g.pp_exp||0)+(g.p_exp||0)+(g.m_exp||0)+(g.g_exp||0)+(g.gg_exp||0)+(g.g1_exp||0)+(g.g2_exp||0)+(g.g3_exp||0), 0));
      setAviamentosCount(av.count || 0);

      const expedidas = new Set<string>((expIds.data || []).map((e: any) => e.ordem_corte_id).filter(Boolean));
      const recebidas = new Set<string>((recIds.data || []).map((r: any) => r.ordem_corte_id).filter(Boolean));
      const entregues = new Set<string>((entIds.data || []).map((e: any) => e.ordem_corte_id).filter(Boolean));
      setExpedidasSet(expedidas);
      setRecebidasSet(recebidas);
      setEntreguesSet(entregues);
      setOrdensAbertas([...expedidas].filter((id) => !recebidas.has(id)).length);

      setLoading(false);
    })();
  }, []);

  const getEtapa = (ocId: string): { label: string; color: string } => {
    if (entreguesSet.has(ocId)) return { label: "Entregue", color: "hsl(142 71% 35%)" };
    if (recebidasSet.has(ocId)) return { label: "Acabamento", color: "hsl(262 60% 55%)" };
    if (expedidasSet.has(ocId)) return { label: "Produção", color: "hsl(217 71% 55%)" };
    return { label: "Corte", color: "hsl(38 92% 50%)" };
  };

  const now = new Date();
  const mesAtual = now.getMonth();
  const anoAtual = now.getFullYear();

  const producaoMes = useMemo(() =>
    ordens.filter((o) => {
      if (!o.data_corte) return false;
      const d = new Date(o.data_corte);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual && o.status === "concluido";
    }).reduce((s, o) => s + (o.quantidade_pecas || 0), 0),
  [ordens, mesAtual, anoAtual]);


  const statusProducao = useMemo(() => {
    const etapas = [
      { key: "Corte", color: "hsl(38 92% 50%)" },
      { key: "Produção", color: "hsl(217 71% 55%)" },
      { key: "Acabamento", color: "hsl(262 60% 55%)" },
      { key: "Entregue", color: "hsl(142 71% 35%)" },
    ];
    const counts: Record<string, number> = { Corte: 0, "Produção": 0, Acabamento: 0, Entregue: 0 };
    ordens.forEach((o) => {
      const e = getEtapa(o.id).label;
      counts[e] = (counts[e] || 0) + 1;
    });
    const total = ordens.length || 1;
    return etapas
      .map((e) => ({
        name: e.key,
        value: Math.round((counts[e.key] / total) * 100),
        fill: e.color,
      }))
      .filter((e) => e.value > 0);
  }, [ordens, expedidasSet, recebidasSet, entreguesSet]);

  const producaoMensal = useMemo(() => {
    const buckets: Record<string, number> = {};
    ordens.forEach((o) => {
      if (!o.data_corte || o.status !== "concluido") return;
      const d = new Date(o.data_corte);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = (buckets[key] || 0) + (o.quantidade_pecas || 0);
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([k, v]) => {
        const [y, m] = k.split("-");
        const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short" });
        return { mes: label, pecas: v };
      });
  }, [ordens]);

  const ultimasOrdens = ordens.slice(0, 6);

  const kpiCards = [
    {
      title: "Produção do Mês",
      value: producaoMes.toLocaleString("pt-BR"),
      subtitle: "Peças concluídas",
      icon: TrendingUp,
    },
    {
      title: "Tecido em Estoque",
      value: `${tecidoEstoque.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mt`,
      subtitle: "Total disponível",
      icon: Layers,
    },
    {
      title: "Ordens em Aberto",
      value: ordensAbertas.toString(),
      subtitle: "Expedidas sem recebimento",
      icon: Scissors,
    },
    {
      title: "Peças Expedidas",
      value: pecasExpedidas.toLocaleString("pt-BR"),
      subtitle: "Total acumulado",
      icon: Truck,
    },
    {
      title: "Aviamentos Cadastrados",
      value: aviamentosCount.toString(),
      subtitle: "Itens no catálogo",
      icon: Package,
    },
  ];

  if (loading) {
    return <PageLoading message="Carregando dashboard..." />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Dashboard" description="Visão geral da produção MKTEC Flow" />

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
            <CardTitle className="text-base">Produção por Mês (concluídas)</CardTitle>
          </CardHeader>
          <CardContent>
            {producaoMensal.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de produção concluída.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={producaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 88%)" />
                  <XAxis dataKey="mes" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR")} />
                  <Bar dataKey="pecas" fill="hsl(217 71% 55%)" radius={[4, 4, 0, 0]} name="Peças" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status das Ordens</CardTitle>
          </CardHeader>
          <CardContent>
            {statusProducao.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem ordens cadastradas.</p>
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
                      <span className="text-muted-foreground">{item.name} ({item.value}%)</span>
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
          <CardTitle className="text-base">Últimas Ordens de Corte</CardTitle>
        </CardHeader>
        <CardContent>
          {ultimasOrdens.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma ordem cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Nº</th>
                    <th className="text-left py-2 font-medium">Modelo</th>
                    <th className="text-left py-2 font-medium">Tecido</th>
                    <th className="text-right py-2 font-medium">Qtd</th>
                    <th className="text-left py-2 font-medium">Data</th>
                    <th className="text-left py-2 font-medium">Etapa</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasOrdens.map((oc) => {
                    const etapa = getEtapa(oc.id);
                    return (
                    <tr key={oc.id} className="border-b last:border-0">
                      <td className="py-2.5 font-mono text-xs">{oc.numero}</td>
                      <td className="py-2.5">{oc.modelo_ref || "—"}</td>
                      <td className="py-2.5">{oc.tecido_nome || "—"}</td>
                      <td className="py-2.5 text-right">{(oc.quantidade_pecas || 0).toLocaleString("pt-BR")}</td>
                      <td className="py-2.5">{oc.data_corte ? new Date(oc.data_corte).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${etapa.color}1f`, color: etapa.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: etapa.color }} />
                          {etapa.label}
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
