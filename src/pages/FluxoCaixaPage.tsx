import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/PageLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ArrowDownRight, Wallet, Search, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface Lancamento {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  tipo: "entrada" | "saida";
  valor: number;
  status: "pago" | "pendente";
}

const chartConfig = {
  entradas: { label: "Entradas", color: "hsl(142 71% 35%)" },
  saidas: { label: "Saídas", color: "hsl(0 72% 51%)" },
  saldo: { label: "Saldo", color: "hsl(217 71% 55%)" },
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function FluxoCaixaPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const all: any[] = [];
      let from = 0;
      const size = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("recebimento")
          .select("id,data_recebimento,oficina_nome,total_pagar,total_sem_defeitos,status")
          .range(from, from + size - 1);
        if (error || !data || data.length === 0) break;
        all.push(...data);
        if (data.length < size) break;
        from += size;
      }
      const items: Lancamento[] = all
        .filter((r) => Number(r.total_pagar || 0) > 0)
        .map((r) => ({
          id: r.id,
          data: r.data_recebimento || "",
          descricao: `Pagamento facção ${r.oficina_nome || "—"}${r.total_sem_defeitos ? ` (${r.total_sem_defeitos} pçs)` : ""}`,
          categoria: "Serviços de Facção",
          tipo: "saida" as const,
          valor: Number(r.total_pagar || 0),
          status: ((r.status || "").toLowerCase() === "pago" ? "pago" : "pendente") as "pago" | "pendente",
        }))
        .filter((l) => l.data)
        .sort((a, b) => b.data.localeCompare(a.data));
      setLancamentos(items);
      setLoading(false);
    })();
  }, []);

  const totalEntradas = 0;
  const totalSaidas = useMemo(
    () => lancamentos.reduce((s, l) => s + l.valor, 0),
    [lancamentos]
  );
  const saldoAtual = totalEntradas - totalSaidas;
  const pendentes = useMemo(
    () => lancamentos.filter((l) => l.status === "pendente").reduce((s, l) => s + l.valor, 0),
    [lancamentos]
  );

  const fluxoMensal = useMemo(() => {
    const buckets: Record<string, { entradas: number; saidas: number }> = {};
    for (const l of lancamentos) {
      const [y, m] = l.data.split("-");
      const key = `${y}-${m}`;
      if (!buckets[key]) buckets[key] = { entradas: 0, saidas: 0 };
      buckets[key].saidas += l.valor;
    }
    let acc = 0;
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        acc += v.entradas - v.saidas;
        const [y, m] = k.split("-");
        const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        return { mes: label, entradas: v.entradas, saidas: v.saidas, saldo: acc };
      });
  }, [lancamentos]);

  const categoriaSaidas = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of lancamentos) map[l.categoria] = (map[l.categoria] || 0) + l.valor;
    return Object.entries(map).map(([categoria, valor]) => ({ categoria, valor }));
  }, [lancamentos]);

  const categorias = Array.from(new Set(lancamentos.map((l) => l.categoria)));

  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((l) => {
      if (filtroCategoria !== "todas" && l.categoria !== filtroCategoria) return false;
      if (filtroStatus !== "todos" && l.status !== filtroStatus) return false;
      if (busca && !l.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [filtroCategoria, filtroStatus, busca, lancamentos]);

  if (loading) return <PageLoading message="Carregando fluxo de caixa..." />;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <PageHeader
        title="Cash Flow"
        description="Saídas reais a partir dos recebimentos pagos às facções"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo (Entradas - Saídas)</p>
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
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Entradas</p>
              <p className="text-2xl font-bold mt-1 text-muted-foreground">—</p>
              <p className="text-[11px] text-muted-foreground mt-1">Sem dados de venda no sistema</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pendente</p>
                <p className="text-2xl font-bold mt-1 text-[hsl(var(--warning))]">{formatCurrency(pendentes)}</p>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[hsl(var(--warning))]/10">
                <Calendar className="w-5 h-5 text-[hsl(var(--warning))]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fluxo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fluxo">Saldo Mensal</TabsTrigger>
          <TabsTrigger value="comparativo">Saídas por Mês</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
        </TabsList>

        <TabsContent value="fluxo">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Evolução do Saldo</CardTitle></CardHeader>
            <CardContent>
              {fluxoMensal.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem lançamentos.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <AreaChart data={fluxoMensal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                    <Area type="monotone" dataKey="saldo" stroke="hsl(217 71% 55%)" fill="hsl(217 71% 55% / 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparativo">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Saídas por Mês</CardTitle></CardHeader>
            <CardContent>
              {fluxoMensal.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem lançamentos.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <BarChart data={fluxoMensal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                    <Bar dataKey="saidas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Saídas por Categoria</CardTitle></CardHeader>
            <CardContent>
              {categoriaSaidas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem lançamentos.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <BarChart data={categoriaSaidas} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <YAxis type="category" dataKey="categoria" width={140} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                    <Bar dataKey="valor" fill="hsl(217 71% 55%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Lançamentos ({lancamentosFiltrados.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-8 h-9 w-[200px]"
                />
              </div>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Categorias</SelectItem>
                  {categorias.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentosFiltrados.slice(0, 200).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{formatDate(l.data)}</TableCell>
                  <TableCell className="font-medium">{l.descricao}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{l.categoria}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={l.status === "pago" ? "default" : "secondary"} className="text-xs">
                      {l.status === "pago" ? "Pago" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-destructive">
                    - {formatCurrency(l.valor)}
                  </TableCell>
                </TableRow>
              ))}
              {lancamentosFiltrados.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Nenhum lançamento encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {lancamentosFiltrados.length > 200 && (
            <p className="text-xs text-muted-foreground text-center py-2">Mostrando 200 de {lancamentosFiltrados.length} lançamentos.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
