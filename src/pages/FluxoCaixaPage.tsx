import { useState, useMemo, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight,
  Wallet, Search, Filter, Calendar, Pencil,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  AreaChart, Area, Tooltip, Legend, LineChart, Line,
} from "recharts";

// ---------- MOCK DATA ----------

interface Lancamento {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  tipo: "entrada" | "saida";
  valor: number;
  status: "pago" | "pendente" | "atrasado";
  formaPagamento: string;
}

const lancamentosIniciais: Lancamento[] = [
  { id: "1", data: "2025-03-01", descricao: "Venda Lojas Renner - NF 4521", categoria: "Vendas", tipo: "entrada", valor: 48500, status: "pago", formaPagamento: "Boleto" },
  { id: "2", data: "2025-03-01", descricao: "Venda Riachuelo - NF 4522", categoria: "Vendas", tipo: "entrada", valor: 32200, status: "pago", formaPagamento: "Transferência" },
  { id: "3", data: "2025-03-02", descricao: "Compra Tecido - Têxtil Brasil", categoria: "Matéria-Prima", tipo: "saida", valor: 18750, status: "pago", formaPagamento: "Boleto" },
  { id: "4", data: "2025-03-04", descricao: "Venda C&A - NF 4523", categoria: "Vendas", tipo: "entrada", valor: 27800, status: "pendente", formaPagamento: "Boleto" },
  { id: "5", data: "2025-03-05", descricao: "Compra Aviamentos - Fios & Cia", categoria: "Matéria-Prima", tipo: "saida", valor: 6800, status: "pago", formaPagamento: "Boleto" },
  { id: "6", data: "2025-03-06", descricao: "Venda Hering - NF 4524", categoria: "Vendas", tipo: "entrada", valor: 19500, status: "pago", formaPagamento: "PIX" },
  { id: "7", data: "2025-03-10", descricao: "Venda Zara - NF 4525", categoria: "Vendas", tipo: "entrada", valor: 55000, status: "pendente", formaPagamento: "Boleto" },
  { id: "8", data: "2025-03-10", descricao: "Frete - Transportadora ABC", categoria: "Logística", tipo: "saida", valor: 5600, status: "pago", formaPagamento: "Boleto" },
  { id: "9", data: "2025-03-14", descricao: "Venda Renner - NF 4526", categoria: "Vendas", tipo: "entrada", valor: 38200, status: "pago", formaPagamento: "Transferência" },
  { id: "10", data: "2025-03-15", descricao: "Compra Tecido Denim - Denim House", categoria: "Matéria-Prima", tipo: "saida", valor: 22000, status: "atrasado", formaPagamento: "Boleto" },
  { id: "11", data: "2025-03-16", descricao: "Serviço Facção - Costura Fina", categoria: "Serviços", tipo: "saida", valor: 15400, status: "pago", formaPagamento: "Transferência" },
  { id: "12", data: "2025-03-18", descricao: "Venda C&A - NF 4527", categoria: "Vendas", tipo: "entrada", valor: 41000, status: "pendente", formaPagamento: "Boleto" },
  { id: "13", data: "2025-03-20", descricao: "Compra Ribana - Malhas SP", categoria: "Matéria-Prima", tipo: "saida", valor: 8500, status: "pago", formaPagamento: "Boleto" },
  { id: "14", data: "2025-03-22", descricao: "Venda Riachuelo - NF 4528", categoria: "Vendas", tipo: "entrada", valor: 29500, status: "pago", formaPagamento: "PIX" },
  { id: "15", data: "2025-03-23", descricao: "Serviço Bordado - Bordados Arte", categoria: "Serviços", tipo: "saida", valor: 7200, status: "pendente", formaPagamento: "Boleto" },
  { id: "16", data: "2025-03-25", descricao: "Frete Entrega Hering", categoria: "Logística", tipo: "saida", valor: 3800, status: "pago", formaPagamento: "Transferência" },
];

const fluxoDiario = [
  { dia: "01/03", entradas: 80700, saidas: 0, saldo: 80700 },
  { dia: "02/03", entradas: 0, saidas: 18750, saldo: 61950 },
  { dia: "04/03", entradas: 27800, saidas: 0, saldo: 89750 },
  { dia: "05/03", entradas: 0, saidas: 6800, saldo: 82950 },
  { dia: "06/03", entradas: 19500, saidas: 0, saldo: 102450 },
  { dia: "10/03", entradas: 55000, saidas: 5600, saldo: 151850 },
  { dia: "14/03", entradas: 38200, saidas: 0, saldo: 190050 },
  { dia: "15/03", entradas: 0, saidas: 22000, saldo: 168050 },
  { dia: "16/03", entradas: 0, saidas: 15400, saldo: 152650 },
  { dia: "18/03", entradas: 41000, saidas: 0, saldo: 193650 },
  { dia: "20/03", entradas: 0, saidas: 8500, saldo: 185150 },
  { dia: "22/03", entradas: 29500, saidas: 0, saldo: 214650 },
  { dia: "23/03", entradas: 0, saidas: 7200, saldo: 207450 },
  { dia: "25/03", entradas: 0, saidas: 3800, saldo: 203650 },
];

const categoriaSaidas = [
  { categoria: "Matéria-Prima", valor: 56050 },
  { categoria: "Serviços", valor: 22600 },
  { categoria: "Logística", valor: 9400 },
];

// ---------- COMPONENT ----------

const chartConfig = {
  entradas: { label: "Entradas", color: "hsl(142 71% 35%)" },
  saidas: { label: "Saídas", color: "hsl(0 72% 51%)" },
  saldo: { label: "Saldo", color: "hsl(217 71% 55%)" },
};

const categoriaChartConfig = {
  valor: { label: "Valor", color: "hsl(217 71% 55%)" },
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function FluxoCaixaPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(lancamentosIniciais);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  const updateStatus = (id: string, newStatus: Lancamento["status"]) => {
    setLancamentos(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  };

  const totalEntradas = useMemo(
    () => lancamentos.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0),
    [lancamentos]
  );
  const totalSaidas = useMemo(
    () => lancamentos.filter((l) => l.tipo === "saida").reduce((s, l) => s + l.valor, 0),
    [lancamentos]
  );
  const saldoAtual = totalEntradas - totalSaidas;
  const pendentes = useMemo(
    () => lancamentos.filter((l) => l.status === "pendente").reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0),
    [lancamentos]
  );

  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((l) => {
      if (filtroTipo !== "todos" && l.tipo !== filtroTipo) return false;
      if (filtroCategoria !== "todas" && l.categoria !== filtroCategoria) return false;
      if (filtroStatus !== "todos" && l.status !== filtroStatus) return false;
      if (busca && !l.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [filtroTipo, filtroCategoria, filtroStatus, busca, lancamentos]);

  const categorias = [...new Set(lancamentos.map((l) => l.categoria))];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <PageHeader
        title="Cash Flow"
        description="Acompanhe entradas, saídas e saldo do fluxo de caixa"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo Atual</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(saldoAtual)}</p>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Entradas</p>
                <p className="text-2xl font-bold mt-1 text-[hsl(var(--success))]">{formatCurrency(totalEntradas)}</p>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[hsl(var(--success))]/10">
                <ArrowUpRight className="w-5 h-5 text-[hsl(var(--success))]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Saídas</p>
                <p className="text-2xl font-bold mt-1 text-destructive">{formatCurrency(totalSaidas)}</p>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-destructive/10">
                <ArrowDownRight className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Previsão Pendente</p>
                <p className="text-2xl font-bold mt-1 text-[hsl(var(--warning))]">{formatCurrency(pendentes)}</p>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[hsl(var(--warning))]/10">
                <Calendar className="w-5 h-5 text-[hsl(var(--warning))]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="fluxo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fluxo">Fluxo Diário</TabsTrigger>
          <TabsTrigger value="comparativo">Entradas vs Saídas</TabsTrigger>
          <TabsTrigger value="categorias">Saídas por Categoria</TabsTrigger>
        </TabsList>

        <TabsContent value="fluxo">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Evolução do Saldo - Março 2025</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <AreaChart data={fluxoDiario}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                  <Area type="monotone" dataKey="saldo" stroke="hsl(217 71% 55%)" fill="hsl(217 71% 55% / 0.15)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparativo">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Entradas vs Saídas por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <BarChart data={fluxoDiario}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                  <Bar dataKey="entradas" fill="hsl(142 71% 35%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={categoriaChartConfig} className="h-[320px] w-full">
                <BarChart data={categoriaSaidas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <YAxis type="category" dataKey="categoria" width={110} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                  <Bar dataKey="valor" fill="hsl(217 71% 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Filters & Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Lançamentos</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-8 h-9 w-[180px]"
                />
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Categorias</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Forma Pgto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentosFiltrados.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{formatDate(l.data)}</TableCell>
                  <TableCell className="font-medium">{l.descricao}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{l.categoria}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.formaPagamento}</TableCell>
                  <TableCell>
                    <Badge
                      variant={l.status === "pago" ? "default" : l.status === "atrasado" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {l.status === "pago" ? "Pago" : l.status === "pendente" ? "Pendente" : "Atrasado"}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${l.tipo === "entrada" ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    {l.tipo === "entrada" ? "+" : "-"} {formatCurrency(l.valor)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar status">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-2" align="end">
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Alterar status:</p>
                        <div className="flex flex-col gap-1">
                          {(["pago", "pendente", "atrasado"] as const).map((s) => (
                            <Button
                              key={s}
                              variant={l.status === s ? "default" : "ghost"}
                              size="sm"
                              className="justify-start text-xs h-7"
                              onClick={() => updateStatus(l.id, s)}
                            >
                              {s === "pago" ? "Pago" : s === "pendente" ? "Pendente" : "Atrasado"}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {lancamentosFiltrados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum lançamento encontrado com os filtros selecionados.
            </div>
          )}
          {/* Totals footer */}
          <div className="flex items-center justify-end gap-6 px-4 py-3 border-t bg-muted/30">
            <div className="text-xs text-muted-foreground">
              {lancamentosFiltrados.length} lançamento(s)
            </div>
            <div className="text-sm font-semibold">
              Total:{" "}
              <span className={
                lancamentosFiltrados.reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0) >= 0
                  ? "text-[hsl(var(--success))]"
                  : "text-destructive"
              }>
                {formatCurrency(
                  lancamentosFiltrados.reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0)
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
