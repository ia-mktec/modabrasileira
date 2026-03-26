import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTecidos, useEstoqueMovimentacoes } from "@/hooks/useSupabaseData";
import { Search, Layers, Package, Lock } from "lucide-react";

const EstoqueTecidosPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { tecidos, loading } = useTecidos();
  const { movimentacoes } = useEstoqueMovimentacoes();

  const filtered = tecidos.filter(
    (t: any) =>
      (t.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.cor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.clientes?.razao_social || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.composicao || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatus = (t: any): "disponivel" | "baixo" | "indisponivel" => {
    const est = Number(t.estoque_kg);
    if (est <= 0) return "indisponivel";
    if (est < 50) return "baixo";
    return "disponivel";
  };

  const totalEstoque = tecidos.reduce((s: number, t: any) => s + Number(t.estoque_kg), 0);
  const totalValor = tecidos.reduce((s: number, t: any) => s + Number(t.estoque_kg) * Number(t.preco_kg), 0);
  const tecidosDisponiveis = tecidos.filter((t: any) => getStatus(t) === "disponivel").length;
  const tecidosBaixo = tecidos.filter((t: any) => getStatus(t) === "baixo").length;
  const tecidosIndisponiveis = tecidos.filter((t: any) => getStatus(t) === "indisponivel").length;

  const statusBadge = (status: "disponivel" | "baixo" | "indisponivel") => {
    const styles: Record<string, string> = {
      disponivel: "bg-[hsl(142_71%_35%/0.15)] text-[hsl(142,71%,35%)] border-[hsl(142_71%_35%/0.3)]",
      baixo: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)] border-[hsl(38_92%_50%/0.3)]",
      indisponivel: "bg-[hsl(0_72%_51%/0.15)] text-[hsl(0,72%,51%)] border-[hsl(0_72%_51%/0.3)]",
    };
    const labels: Record<string, string> = { disponivel: "Disponível", baixo: "Estoque Baixo", indisponivel: "Indisponível" };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>{labels[status]}</span>;
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
            <p className="text-2xl font-bold font-mono">{totalEstoque.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">Total Estoque (Kg)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-5 h-5 mx-auto mb-1 text-[hsl(142,71%,35%)]" />
            <p className="text-2xl font-bold font-mono">{tecidosDisponiveis}</p>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-5 h-5 mx-auto mb-1 text-[hsl(38,92%,50%)]" />
            <p className="text-2xl font-bold font-mono">{tecidosBaixo}</p>
            <p className="text-xs text-muted-foreground">Estoque Baixo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold font-mono">{tecidosIndisponiveis}</p>
            <p className="text-xs text-muted-foreground">Indisponíveis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold font-mono text-primary">R$ {totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">Valor Total Estoque</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, cor, cliente ou composição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold">Tecido</th>
                  <th className="text-left py-3 px-4 font-semibold">Composição</th>
                  <th className="text-left py-3 px-4 font-semibold">Cor</th>
                  <th className="text-left py-3 px-4 font-semibold">Cliente</th>
                  <th className="text-right py-3 px-4 font-semibold">Estoque (Kg)</th>
                  <th className="text-right py-3 px-4 font-semibold">Preço/Kg (R$)</th>
                  <th className="text-center py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{t.nome}</td>
                    <td className="py-3 px-4 text-muted-foreground">{t.composicao}</td>
                    <td className="py-3 px-4">{t.cor}</td>
                    <td className="py-3 px-4">{t.clientes?.razao_social || "—"}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">{Number(t.estoque_kg).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right font-mono">{Number(t.preco_kg).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">{statusBadge(getStatus(t))}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">Nenhum tecido encontrado.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={4} className="py-3 px-4 text-right">Totais:</td>
                  <td className="py-3 px-4 text-right font-mono">{filtered.reduce((s: number, t: any) => s + Number(t.estoque_kg), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Últimas Movimentações */}
      {movimentacoes.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="bg-[hsl(142,71%,35%/0.1)] px-4 py-2 border-b">
              <h3 className="text-xs font-bold flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-[hsl(142,71%,35%)]" />
                Últimas Movimentações ({movimentacoes.length})
              </h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2 px-4 font-semibold">Data</th>
                  <th className="text-left py-2 px-4 font-semibold">Tecido</th>
                  <th className="text-left py-2 px-4 font-semibold">Tipo</th>
                  <th className="text-right py-2 px-4 font-semibold">Quantidade (Kg)</th>
                  <th className="text-left py-2 px-4 font-semibold">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.slice(0, 20).map((m: any) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-2 px-4 font-mono">{new Date(m.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2 px-4">{m.tecidos?.nome} {m.tecidos?.cor ? `- ${m.tecidos.cor}` : ""}</td>
                    <td className="py-2 px-4 capitalize">{m.tipo}</td>
                    <td className="py-2 px-4 text-right font-mono font-semibold">{Number(m.quantidade_kg).toFixed(2)}</td>
                    <td className="py-2 px-4 text-muted-foreground">{m.descricao || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EstoqueTecidosPage;
