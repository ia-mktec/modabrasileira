import { useEffect, useMemo, useState } from "react";
import { PageLoading } from "@/components/shared/PageLoading";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Users, ShoppingBag, PackageCheck, Filter, X, TrendingUp, ArrowUpRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pendente: "hsl(38, 92%, 50%)",
  em_andamento: "hsl(217, 71%, 55%)",
  concluido: "hsl(142, 71%, 35%)",
  cancelado: "hsl(0, 72%, 51%)",
};
const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

function KpiCard({ title, value, subtitle, icon: Icon }: {
  title: string; value: string; subtitle: string; icon: React.ElementType;
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
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function monthsBack(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const RelatorioClientesPage = () => {
  const [periodo, setPeriodo] = useState("6m");
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [ordens, setOrdens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async <T,>(table: string, columns: string): Promise<T[]> => {
      const PAGE = 1000;
      let from = 0;
      const all: T[] = [];
      while (true) {
        const { data, error } = await supabase.from(table as any).select(columns).range(from, from + PAGE - 1);
        if (error || !data) break;
        all.push(...(data as T[]));
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return all;
    };
    (async () => {
      const [c, o] = await Promise.all([
        fetchAll<any>("clientes", "id,razao_social,status"),
        fetchAll<any>("ordens_corte", "id,cliente_id,modelo_ref,quantidade_pecas,data_corte,status"),
      ]);
      setClientes(c);
      setOrdens(o);
      setLoading(false);
    })();
  }, []);

  const cutoff = useMemo(() => {
    if (periodo === "1m") return monthsBack(1);
    if (periodo === "3m") return monthsBack(3);
    if (periodo === "6m") return monthsBack(6);
    if (periodo === "12m") return monthsBack(12);
    return null;
  }, [periodo]);

  const ordensPeriodo = useMemo(() => {
    if (!cutoff) return ordens;
    return ordens.filter((o) => o.data_corte && new Date(o.data_corte) >= cutoff);
  }, [ordens, cutoff]);

  const clienteById = useMemo(() => {
    const m = new Map<string, string>();
    clientes.forEach((c) => m.set(c.id, c.razao_social));
    return m;
  }, [clientes]);

  const allClienteNames = useMemo(() => {
    const set = new Set<string>();
    ordensPeriodo.forEach((o) => {
      const name = clienteById.get(o.cliente_id) || (o.cliente_id ? "Sem cadastro" : "Sem cliente");
      set.add(name);
    });
    return Array.from(set).sort();
  }, [ordensPeriodo, clienteById]);

  const isAllSelected = selectedClientes.length === 0;
  const activeFilter = isAllSelected ? allClienteNames : selectedClientes;

  const ordensFiltradas = useMemo(() => ordensPeriodo.filter((o) => {
    const name = clienteById.get(o.cliente_id) || (o.cliente_id ? "Sem cadastro" : "Sem cliente");
    return activeFilter.includes(name);
  }), [ordensPeriodo, activeFilter, clienteById]);

  const pedidosPorCliente = useMemo(() => {
    const map = new Map<string, { cliente: string; ordens: number; pecas: number }>();
    ordensFiltradas.forEach((o) => {
      const name = clienteById.get(o.cliente_id) || (o.cliente_id ? "Sem cadastro" : "Sem cliente");
      const cur = map.get(name) || { cliente: name, ordens: 0, pecas: 0 };
      cur.ordens += 1;
      cur.pecas += o.quantidade_pecas || 0;
      map.set(name, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.pecas - a.pecas);
  }, [ordensFiltradas, clienteById]);

  const statusPedidos = useMemo(() => {
    const counts: Record<string, number> = {};
    ordensFiltradas.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    const total = ordensFiltradas.length || 1;
    return Object.entries(counts).map(([k, v]) => ({
      name: STATUS_LABELS[k] || k,
      value: Math.round((v / total) * 100),
      fill: STATUS_COLORS[k] || "hsl(220, 14%, 50%)",
    }));
  }, [ordensFiltradas]);

  const evolucaoMensal = useMemo(() => {
    const buckets: Record<string, number> = {};
    ordensFiltradas.forEach((o) => {
      if (!o.data_corte) return;
      const d = new Date(o.data_corte);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = (buckets[key] || 0) + (o.quantidade_pecas || 0);
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        const [y, m] = k.split("-");
        return { mes: new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), pecas: v };
      });
  }, [ordensFiltradas]);

  const topModelos = useMemo(() => {
    const map = new Map<string, { modelo: string; pecas: number; ordens: number }>();
    ordensFiltradas.forEach((o) => {
      if (!o.modelo_ref) return;
      const cur = map.get(o.modelo_ref) || { modelo: o.modelo_ref, pecas: 0, ordens: 0 };
      cur.pecas += o.quantidade_pecas || 0;
      cur.ordens += 1;
      map.set(o.modelo_ref, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.pecas - a.pecas).slice(0, 10);
  }, [ordensFiltradas]);

  const totalPecas = pedidosPorCliente.reduce((s, c) => s + c.pecas, 0);
  const totalOrdens = pedidosPorCliente.reduce((s, c) => s + c.ordens, 0);
  const modelosUnicos = useMemo(() => {
    const set = new Set<string>();
    ordensFiltradas.forEach((o) => { if (o.modelo_ref) set.add(o.modelo_ref); });
    return set.size;
  }, [ordensFiltradas]);
  const clientesAtivos = useMemo(() => {
    const ativos = new Set<string>();
    clientes.forEach((c) => { if (c.status === "ativo") ativos.add(c.razao_social); });
    return activeFilter.filter((n) => ativos.has(n)).length;
  }, [clientes, activeFilter]);

  const toggleCliente = (name: string) => {
    setSelectedClientes((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };

  if (loading) {
    return <PageLoading message="Carregando relatório..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Relatório de Clientes" description="Acompanhamento de produção por cliente" />
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                {isAllSelected ? "Todos os Clientes" : `${selectedClientes.length} selecionado(s)`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filtrar Clientes</span>
                  {!isAllSelected && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedClientes([])}>Limpar</Button>
                  )}
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {allClienteNames.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum cliente no período.</p>
                  )}
                  {allClienteNames.map((name) => (
                    <label key={name} className="flex items-center gap-2 cursor-pointer text-sm hover:text-primary transition-colors">
                      <Checkbox checked={selectedClientes.includes(name)} onCheckedChange={() => toggleCliente(name)} />
                      {name}
                    </label>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mês</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Último ano</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Clientes Ativos" value={loading ? "—" : String(clientesAtivos)} subtitle={`${clientes.length} cadastrados`} icon={Users} />
        <KpiCard title="Ordens de Corte" value={loading ? "—" : String(totalOrdens)} subtitle="no período" icon={ShoppingBag} />
        <KpiCard title="Peças Produzidas" value={loading ? "—" : totalPecas.toLocaleString("pt-BR")} subtitle="no período" icon={PackageCheck} />
        <KpiCard title="Modelos Únicos" value={loading ? "—" : String(modelosUnicos)} subtitle="referências usadas" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Peças por Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {pedidosPorCliente.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pedidosPorCliente.slice(0, 10)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" />
                    <XAxis dataKey="cliente" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR")} />
                    <Bar dataKey="pecas" name="Peças" fill="hsl(217, 71%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Status das Ordens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {statusPedidos.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPedidos} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {statusPedidos.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Evolução Mensal — Peças</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {evolucaoMensal.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
              ) : (
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
                    <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR")} />
                    <Area type="monotone" dataKey="pecas" name="Peças" stroke="hsl(217, 71%, 55%)" fill="url(#gradPecas)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Modelos por Peças</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] overflow-y-auto">
              {topModelos.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 font-medium">Referência</th>
                      <th className="text-right py-2 font-medium">Ordens</th>
                      <th className="text-right py-2 font-medium">Peças</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topModelos.map((m) => (
                      <tr key={m.modelo} className="border-b last:border-0">
                        <td className="py-2 font-mono text-xs">{m.modelo}</td>
                        <td className="py-2 text-right">{m.ordens}</td>
                        <td className="py-2 text-right">{m.pecas.toLocaleString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RelatorioClientesPage;
