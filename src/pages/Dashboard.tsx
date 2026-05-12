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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [oc, tec, expGrade, av] = await Promise.all([
        supabase.from("ordens_corte").select("id,numero,modelo_ref,tecido_nome,quantidade_pecas,data_corte,status").order("data_corte", { ascending: false }),
        supabase.from("tecidos").select("estoque_kg"),
        supabase.from("grade_expedicao").select("pp_exp,p_exp,m_exp,g_exp,gg_exp,g1_exp,g2_exp,g3_exp"),
        supabase.from("aviamentos").select("id", { count: "exact", head: true }),
      ]);
      setOrdens(oc.data || []);
      setTecidoEstoque((tec.data || []).reduce((s, t: any) => s + Number(t.estoque_kg || 0), 0));
      setPecasExpedidas((expGrade.data || []).reduce((s, g: any) =>
        s + (g.pp_exp||0)+(g.p_exp||0)+(g.m_exp||0)+(g.g_exp||0)+(g.gg_exp||0)+(g.g1_exp||0)+(g.g2_exp||0)+(g.g3_exp||0), 0));
      setAviamentosCount(av.count || 0);
      setLoading(false);
    })();
  }, []);

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

  const ordensAbertas = useMemo(() =>
    ordens.filter((o) => o.status === "pendente" || o.status === "em_andamento").length,
  [ordens]);

  const statusProducao = useMemo(() => {
    const counts: Record<string, number> = {};
    ordens.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    const total = ordens.length || 1;
    return Object.entries(counts).map(([k, v]) => ({
      name: STATUS_LABELS[k] || k,
      value: Math.round((v / total) * 100),
      fill: STATUS_COLORS[k] || "hsl(220 14% 50%)",
    }));
  }, [ordens]);

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
      subtitle: "Pendentes / em andamento",
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
                    <th className="text-left py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasOrdens.map((oc) => (
                    <tr key={oc.id} className="border-b last:border-0">
                      <td className="py-2.5 font-mono text-xs">{oc.numero}</td>
                      <td className="py-2.5">{oc.modelo_ref || "—"}</td>
                      <td className="py-2.5">{oc.tecido_nome || "—"}</td>
                      <td className="py-2.5 text-right">{(oc.quantidade_pecas || 0).toLocaleString("pt-BR")}</td>
                      <td className="py-2.5">{oc.data_corte ? new Date(oc.data_corte).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="py-2.5"><StatusBadge status={oc.status} /></td>
                    </tr>
                  ))}
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
