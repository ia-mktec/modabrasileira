import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Layers, Package } from "lucide-react";

interface Entrada {
  cliente_nome: string | null;
  nome_tecido: string;
  composicao: string | null;
  cor: string | null;
  unidade_medida: string | null;
  status: string | null;
  qtde_rolos: number | null;
  metragem_total: number | null;
}

interface SaldoRow {
  key: string;
  cliente: string;
  tecido: string;
  composicao: string;
  cor: string;
  unidade: string;
  rolos: number;
  entrada: number;
  alocado: number;
  disponivel: number;
}

const corHex: Record<string, string> = {
  Branco: "#FFFFFF", Preto: "#000000", Cinza: "#808080", Bege: "#F5DEB3",
  Areia: "#C2B280", Terra: "#8B4513", Marrom: "#5C4033", Caqui: "#C3B091",
  Azul: "#1E40AF", "Azul Marinho": "#1B2A4E", Vermelho: "#DC2626",
  Verde: "#16A34A", Amarelo: "#FACC15", Rosa: "#F472B6", Roxo: "#7C3AED",
  Laranja: "#F97316", Vinho: "#722F37", Mostarda: "#FFDB58",
};

const EstoqueTecidosPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "disponivel" | "alocado" | "esgotado">("todos");
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const all: Entrada[] = [];
      let from = 0;
      const size = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("tecido_entradas")
          .select("cliente_nome,nome_tecido,composicao,cor,unidade_medida,status,qtde_rolos,metragem_total")
          .range(from, from + size - 1);
        if (error || !data || data.length === 0) break;
        all.push(...(data as Entrada[]));
        if (data.length < size) break;
        from += size;
      }
      setEntradas(all);
      setLoading(false);
    })();
  }, []);

  const saldos: SaldoRow[] = useMemo(() => {
    const map = new Map<string, SaldoRow>();
    for (const e of entradas) {
      const cliente = e.cliente_nome || "—";
      const tecido = e.nome_tecido || "";
      const comp = e.composicao || "";
      const cor = e.cor || "—";
      const un = e.unidade_medida || "mt";
      const key = `${cliente}|${tecido}|${comp}|${cor}|${un}`;
      const qtd = Number(e.metragem_total || 0);
      const rolos = Number(e.qtde_rolos || 0);
      let row = map.get(key);
      if (!row) {
        row = { key, cliente, tecido, composicao: comp, cor, unidade: un, rolos: 0, entrada: 0, alocado: 0, disponivel: 0 };
        map.set(key, row);
      }
      row.entrada += qtd;
      row.rolos += rolos;
      if ((e.status || "").toLowerCase().startsWith("aloc")) row.alocado += qtd;
    }
    for (const r of map.values()) r.disponivel = r.entrada - r.alocado;
    return Array.from(map.values()).sort((a, b) =>
      a.cliente.localeCompare(b.cliente) || a.tecido.localeCompare(b.tecido) || a.cor.localeCompare(b.cor)
    );
  }, [entradas]);

  const filtered = saldos.filter((r) => {
    const t = searchTerm.toLowerCase();
    const matchSearch =
      !t ||
      r.tecido.toLowerCase().includes(t) ||
      r.cor.toLowerCase().includes(t) ||
      r.cliente.toLowerCase().includes(t) ||
      r.composicao.toLowerCase().includes(t);
    const matchStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "disponivel" && r.disponivel > 0) ||
      (filtroStatus === "alocado" && r.alocado > 0) ||
      (filtroStatus === "esgotado" && r.disponivel <= 0);
    return matchSearch && matchStatus;
  });

  const totEntrada = saldos.reduce((s, r) => s + r.entrada, 0);
  const totAloc = saldos.reduce((s, r) => s + r.alocado, 0);
  const totDisp = saldos.reduce((s, r) => s + r.disponivel, 0);
  const itensDisp = saldos.filter((r) => r.disponivel > 0).length;
  const itensEsg = saldos.filter((r) => r.disponivel <= 0).length;

  const statusBadge = (r: SaldoRow) => {
    if (r.disponivel <= 0) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[hsl(0_72%_51%/0.15)] text-[hsl(0,72%,51%)] border-[hsl(0_72%_51%/0.3)]">Esgotado</span>;
    }
    if (r.alocado > 0) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)] border-[hsl(38_92%_50%/0.3)]">Parcial</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[hsl(142_71%_35%/0.15)] text-[hsl(142,71%,35%)] border-[hsl(142_71%_35%/0.3)]">Disponível</span>;
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando estoque...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">ESTOQUE DE TECIDOS</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Layers className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold font-mono">{totEntrada.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground">Entrada Total (mt/kg)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-5 h-5 mx-auto mb-1 text-[hsl(38,92%,50%)]" />
            <p className="text-xl font-bold font-mono">{totAloc.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground">Alocado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-5 h-5 mx-auto mb-1 text-[hsl(142,71%,35%)]" />
            <p className="text-xl font-bold font-mono">{totDisp.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground">Saldo Disponível</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold font-mono text-[hsl(142,71%,35%)]">{itensDisp}</p>
            <p className="text-xs text-muted-foreground">Itens c/ Saldo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold font-mono text-destructive">{itensEsg}</p>
            <p className="text-xs text-muted-foreground">Itens Esgotados</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por tecido, cor, cliente ou composição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {(["todos", "disponivel", "alocado", "esgotado"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors capitalize ${
                filtroStatus === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
              }`}
            >
              {s === "todos" ? "Todos" : s === "disponivel" ? "Com Saldo" : s === "alocado" ? "Com Alocação" : "Esgotados"}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-3 font-semibold">Cliente</th>
                  <th className="text-left py-3 px-3 font-semibold">Tecido</th>
                  <th className="text-left py-3 px-3 font-semibold">Composição</th>
                  <th className="text-left py-3 px-3 font-semibold">Cor</th>
                  <th className="text-center py-3 px-3 font-semibold">Un.</th>
                  <th className="text-right py-3 px-3 font-semibold">Rolos</th>
                  <th className="text-right py-3 px-3 font-semibold">Entrada</th>
                  <th className="text-right py-3 px-3 font-semibold">Alocado</th>
                  <th className="text-right py-3 px-3 font-semibold">Saldo</th>
                  <th className="text-center py-3 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.key} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3">{r.cliente}</td>
                    <td className="py-2 px-3 font-medium">{r.tecido}</td>
                    <td className="py-2 px-3 text-muted-foreground">{r.composicao}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: corHex[r.cor] || "#D1D5DB" }} />
                        {r.cor}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">{r.unidade}</td>
                    <td className="py-2 px-3 text-right font-mono">{r.rolos}</td>
                    <td className="py-2 px-3 text-right font-mono">{r.entrada.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                    <td className="py-2 px-3 text-right font-mono text-[hsl(38,92%,50%)]">{r.alocado.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                    <td className={`py-2 px-3 text-right font-mono font-semibold ${r.disponivel > 0 ? "text-[hsl(142,71%,35%)]" : "text-destructive"}`}>
                      {r.disponivel.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-center">{statusBadge(r)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="py-8 text-center text-muted-foreground text-sm">Nenhum tecido encontrado.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={6} className="py-3 px-3 text-right">Totais ({filtered.length} itens):</td>
                  <td className="py-3 px-3 text-right font-mono">{filtered.reduce((s, r) => s + r.entrada, 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-right font-mono text-[hsl(38,92%,50%)]">{filtered.reduce((s, r) => s + r.alocado, 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-right font-mono text-[hsl(142,71%,35%)]">{filtered.reduce((s, r) => s + r.disponivel, 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstoqueTecidosPage;
