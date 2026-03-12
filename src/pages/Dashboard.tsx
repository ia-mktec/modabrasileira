import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  dashboardKPIs,
  producaoSemanal,
  ordensCorte,
} from "@/lib/mock-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Scissors,
  Layers,
  TrendingUp,
  Package,
  Target,
  Truck,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const statusProducao = [
  { name: "Corte", value: 35, fill: "hsl(217 71% 55%)" },
  { name: "Costura", value: 40, fill: "hsl(199 89% 48%)" },
  { name: "Acabamento", value: 15, fill: "hsl(142 71% 35%)" },
  { name: "Expedição", value: 10, fill: "hsl(38 92% 50%)" },
];

const kpiCards = [
  {
    title: "Produção do Mês",
    value: dashboardKPIs.producaoMes.toLocaleString("pt-BR"),
    subtitle: `Meta: ${dashboardKPIs.producaoMeta.toLocaleString("pt-BR")}`,
    icon: TrendingUp,
    progress: (dashboardKPIs.producaoMes / dashboardKPIs.producaoMeta) * 100,
  },
  {
    title: "Tecido em Estoque",
    value: `${dashboardKPIs.tecidoEstoque.toLocaleString("pt-BR")} kg`,
    subtitle: "6 tipos ativos",
    icon: Layers,
  },
  {
    title: "Ordens de Corte",
    value: dashboardKPIs.ordensAbertas.toString(),
    subtitle: "Abertas / em andamento",
    icon: Scissors,
  },
  {
    title: "Eficiência do Corte",
    value: `${dashboardKPIs.eficienciaCorte}%`,
    subtitle: "Aproveitamento médio",
    icon: Target,
  },
  {
    title: "Peças Expedidas",
    value: dashboardKPIs.pecasExpedidas.toLocaleString("pt-BR"),
    subtitle: "Este mês",
    icon: Truck,
  },
  {
    title: "Aviamentos",
    value: "142",
    subtitle: "Itens em estoque",
    icon: Package,
  },
];

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da produção MKTEC Flow"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpi.subtitle}
              </p>
              {kpi.progress && (
                <Progress value={kpi.progress} className="mt-3 h-1.5" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Produção Semanal Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Produção Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={producaoSemanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 88%)" />
                <XAxis dataKey="dia" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222 25% 12%)",
                    border: "1px solid hsl(222 20% 20%)",
                    borderRadius: "8px",
                    color: "hsl(220 14% 90%)",
                  }}
                />
                <Bar dataKey="meta" fill="hsl(220 14% 88%)" radius={[4, 4, 0, 0]} name="Meta" />
                <Bar dataKey="pecas" fill="hsl(217 71% 55%)" radius={[4, 4, 0, 0]} name="Produzido" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Produção Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status da Produção</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusProducao}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
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
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-muted-foreground">
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas Ordens de Corte */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas Ordens de Corte</CardTitle>
        </CardHeader>
        <CardContent>
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
                {ordensCorte.map((oc) => (
                  <tr key={oc.id} className="border-b last:border-0">
                    <td className="py-2.5 font-mono text-xs">{oc.numero}</td>
                    <td className="py-2.5">{oc.modeloRef}</td>
                    <td className="py-2.5">{oc.tecido}</td>
                    <td className="py-2.5 text-right">{oc.quantidadePecas}</td>
                    <td className="py-2.5">
                      {new Date(oc.dataCorte).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={oc.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
