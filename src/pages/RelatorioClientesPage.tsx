import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { clientes } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";
import {
  Users, ShoppingBag, TrendingUp, PackageCheck, ArrowUpRight, ArrowDownRight, Filter, X, Calendar as CalendarIcon,
} from "lucide-react";

// --- Mock data for reports ---
const pedidosPorCliente = [
  { cliente: "Renner", pedidos: 48, pecas: 12400, faturamento: 385000 },
  { cliente: "Riachuelo", pedidos: 35, pecas: 9200, faturamento: 276000 },
  { cliente: "C&A", pedidos: 42, pecas: 11000, faturamento: 341000 },
  { cliente: "Marisa", pedidos: 12, pecas: 3100, faturamento: 93000 },
  { cliente: "Hering", pedidos: 28, pecas: 7500, faturamento: 232500 },
  { cliente: "Zara", pedidos: 22, pecas: 5800, faturamento: 203000 },
];

const modelosPorCliente = [
  { cliente: "Renner", camiseta: 4200, polo: 3100, moletom: 2800, vestido: 2300 },
  { cliente: "Riachuelo", camiseta: 3500, polo: 2200, moletom: 1800, vestido: 1700 },
  { cliente: "C&A", camiseta: 3800, polo: 2800, moletom: 2100, vestido: 2300 },
  { cliente: "Hering", camiseta: 2800, polo: 1900, moletom: 1500, vestido: 1300 },
  { cliente: "Zara", camiseta: 2000, polo: 1500, moletom: 1200, vestido: 1100 },
];

const statusPedidos = [
  { name: "Concluído", value: 62, fill: "hsl(142, 71%, 35%)" },
  { name: "Em Produção", value: 24, fill: "hsl(217, 71%, 55%)" },
  { name: "Pendente", value: 10, fill: "hsl(38, 92%, 50%)" },
  { name: "Cancelado", value: 4, fill: "hsl(0, 72%, 51%)" },
];

const evolucaoMensal = [
  { mes: "Set", pecas: 8200, faturamento: 246000 },
  { mes: "Out", pecas: 9400, faturamento: 282000 },
  { mes: "Nov", pecas: 10800, faturamento: 324000 },
  { mes: "Dez", pecas: 12500, faturamento: 375000 },
  { mes: "Jan", pecas: 11200, faturamento: 336000 },
  { mes: "Fev", pecas: 13100, faturamento: 393000 },
];

const entregasPorCliente = [
  { cliente: "Renner", noPrazo: 42, atrasado: 6 },
  { cliente: "Riachuelo", noPrazo: 30, atrasado: 5 },
  { cliente: "C&A", noPrazo: 38, atrasado: 4 },
  { cliente: "Marisa", noPrazo: 10, atrasado: 2 },
  { cliente: "Hering", noPrazo: 25, atrasado: 3 },
  { cliente: "Zara", noPrazo: 20, atrasado: 2 },
];

const topModelosClientes = [
  { cliente: "Renner", modelo: "Camiseta Básica", ref: "MK-2024-001", pecas: 4200, status: "concluido" },
  { cliente: "C&A", modelo: "Camiseta Básica", ref: "MK-2024-001", pecas: 3800, status: "em_andamento" },
  { cliente: "Riachuelo", modelo: "Polo Masculina", ref: "MK-2024-002", pecas: 3500, status: "concluido" },
  { cliente: "Renner", modelo: "Polo Masculina", ref: "MK-2024-002", pecas: 3100, status: "em_andamento" },
  { cliente: "Hering", modelo: "Camiseta Básica", ref: "MK-2024-001", pecas: 2800, status: "concluido" },
  { cliente: "C&A", modelo: "Moletom Canguru", ref: "MK-2024-003", pecas: 2100, status: "pendente" },
  { cliente: "Zara", modelo: "Vestido Midi", ref: "MK-2024-004", pecas: 1100, status: "pendente" },
  { cliente: "Marisa", modelo: "Calça Jeans", ref: "MK-2024-005", pecas: 900, status: "cancelado" },
];

function KpiCard({ title, value, subtitle, icon: Icon, trend, trendUp }: {
  title: string; value: string; subtitle: string; icon: React.ElementType; trend: string; trendUp: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <span className={`text-xs font-medium flex items-center gap-0.5 ${trendUp ? "text-[hsl(142,71%,35%)]" : "text-destructive"}`}>
              {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = [
  "hsl(217, 71%, 55%)",
  "hsl(199, 89%, 48%)",
  "hsl(142, 71%, 35%)",
  "hsl(38, 92%, 50%)",
];

const allClienteNames = pedidosPorCliente.map((c) => c.cliente);

const RelatorioClientesPage = () => {
  const [periodo, setPeriodo] = useState("6m");
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const isAllSelected = selectedClientes.length === 0;
  const activeFilter = isAllSelected ? allClienteNames : selectedClientes;

  const filteredPedidos = useMemo(() => pedidosPorCliente.filter((c) => activeFilter.includes(c.cliente)), [activeFilter]);
  const filteredModelos = useMemo(() => modelosPorCliente.filter((c) => activeFilter.includes(c.cliente)), [activeFilter]);
  const filteredEntregas = useMemo(() => entregasPorCliente.filter((c) => activeFilter.includes(c.cliente)), [activeFilter]);
  const filteredTopModelos = useMemo(() => topModelosClientes.filter((r) => activeFilter.includes(r.cliente)), [activeFilter]);

  const totalPecas = filteredPedidos.reduce((s, c) => s + c.pecas, 0);
  const totalFaturamento = filteredPedidos.reduce((s, c) => s + c.faturamento, 0);
  const totalPedidos = filteredPedidos.reduce((s, c) => s + c.pedidos, 0);
  const clientesAtivos = clientes.filter((c) => c.status === "ativo").length;

  const toggleCliente = (name: string) => {
    setSelectedClientes((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Relatório de Clientes" description="Acompanhamento de produção por cliente" />
        <div className="flex items-center gap-2">
          {/* Filtro de clientes */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                {isAllSelected ? "Todos os Clientes" : `${selectedClientes.length} selecionado(s)`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filtrar Clientes</span>
                  {!isAllSelected && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedClientes([])}>
                      Limpar
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {allClienteNames.map((name) => (
                    <label key={name} className="flex items-center gap-2 cursor-pointer text-sm hover:text-primary transition-colors">
                      <Checkbox
                        checked={selectedClientes.includes(name)}
                        onCheckedChange={() => toggleCliente(name)}
                      />
                      {name}
                    </label>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={periodo} onValueChange={(v) => { setPeriodo(v); if (v !== "custom") { setDateFrom(undefined); setDateTo(undefined); } }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mês</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Último ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {periodo === "custom" && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} locale={ptBR} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} locale={ptBR} disabled={(date) => dateFrom ? date < dateFrom : false} />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Badges dos clientes selecionados */}
      {!isAllSelected && (
        <div className="flex flex-wrap gap-2">
          {selectedClientes.map((name) => (
            <Badge key={name} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleCliente(name)}>
              {name}
              <X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Clientes Ativos" value={isAllSelected ? String(clientesAtivos) : String(selectedClientes.length)} subtitle={isAllSelected ? `de ${clientes.length} cadastrados` : "selecionados"} icon={Users} trend="+2 este mês" trendUp />
        <KpiCard title="Total Pedidos" value={String(totalPedidos)} subtitle="no período" icon={ShoppingBag} trend="+12%" trendUp />
        <KpiCard title="Peças Produzidas" value={totalPecas.toLocaleString("pt-BR")} subtitle="para clientes filtrados" icon={PackageCheck} trend="+8.5%" trendUp />
        <KpiCard title="Faturamento" value={`R$ ${(totalFaturamento / 1000).toFixed(0)}k`} subtitle="no período" icon={TrendingUp} trend="+15.2%" trendUp />
      </div>

      {/* Row 1: Pedidos por cliente + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Peças por Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredPedidos} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" />
                  <XAxis dataKey="cliente" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,14%,88%)", fontSize: 12 }}
                    formatter={(v: number) => v.toLocaleString("pt-BR")}
                  />
                  <Bar dataKey="pecas" name="Peças" fill="hsl(217, 71%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Status dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPedidos}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPedidos.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Evolução mensal + Modelos por cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Evolução Mensal — Peças & Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucaoMensal} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradPecas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 71%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 71%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,14%,88%)", fontSize: 12 }} formatter={(v: number) => v.toLocaleString("pt-BR")} />
                  <Area type="monotone" dataKey="pecas" name="Peças" stroke="hsl(217, 71%, 55%)" fill="url(#gradPecas)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Modelos por Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredModelos} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" />
                  <XAxis dataKey="cliente" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,14%,88%)", fontSize: 12 }} formatter={(v: number) => v.toLocaleString("pt-BR")} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="camiseta" name="Camiseta" stackId="a" fill={CHART_COLORS[0]} />
                  <Bar dataKey="polo" name="Polo" stackId="a" fill={CHART_COLORS[1]} />
                  <Bar dataKey="moletom" name="Moletom" stackId="a" fill={CHART_COLORS[2]} />
                  <Bar dataKey="vestido" name="Vestido" stackId="a" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Pontualidade de entregas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Pontualidade de Entregas por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredEntregas} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="cliente" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,14%,88%)", fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="noPrazo" name="No Prazo" stackId="a" fill="hsl(142, 71%, 35%)" />
                <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Row 4: Tabela detalhada */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Detalhamento — Top Modelos por Cliente</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Modelo</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Referência</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Peças</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTopModelos.map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{row.cliente}</td>
                    <td className="py-3 px-4">{row.modelo}</td>
                    <td className="py-3 px-4 font-mono text-xs">{row.ref}</td>
                    <td className="py-3 px-4 text-right font-medium">{row.pecas.toLocaleString("pt-BR")}</td>
                    <td className="py-3 px-4"><StatusBadge status={row.status} /></td>
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

export default RelatorioClientesPage;
