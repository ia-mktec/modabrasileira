import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEstoque } from "@/contexts/EstoqueContext";
import { Search, Layers, Package, Lock } from "lucide-react";

const EstoqueTecidosPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { tecidosEstoque, reservas, getEstoqueDisponivel, getEstoqueReservado, getStatusEstoque } = useEstoque();

  const filtered = tecidosEstoque.filter(
    (t) =>
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.composicao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEstoque = tecidosEstoque.reduce((s, t) => s + t.estoqueKg, 0);
  const totalReservado = tecidosEstoque.reduce((s, t) => s + getEstoqueReservado(t.id), 0);
  const totalDisponivel = tecidosEstoque.reduce((s, t) => s + getEstoqueDisponivel(t.id), 0);
  const totalValor = tecidosEstoque.reduce((s, t) => s + t.estoqueKg * t.precoKg, 0);
  const tecidosDisponiveis = tecidosEstoque.filter((t) => getStatusEstoque(t.id) === "disponivel").length;
  const tecidosBaixo = tecidosEstoque.filter((t) => getStatusEstoque(t.id) === "baixo").length;
  const tecidosIndisponiveis = tecidosEstoque.filter((t) => getStatusEstoque(t.id) === "indisponivel").length;

  const reservasAtivas = reservas.filter((r) => r.status === "reservado");
  const reservasConfirmadas = reservas.filter((r) => r.status === "confirmado");

  const statusBadge = (status: "disponivel" | "baixo" | "indisponivel") => {
    const styles: Record<string, string> = {
      disponivel: "bg-[hsl(142_71%_35%/0.15)] text-[hsl(142,71%,35%)] border-[hsl(142_71%_35%/0.3)]",
      baixo: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)] border-[hsl(38_92%_50%/0.3)]",
      indisponivel: "bg-[hsl(0_72%_51%/0.15)] text-[hsl(0,72%,51%)] border-[hsl(0_72%_51%/0.3)]",
    };
    const labels: Record<string, string> = {
      disponivel: "Disponível",
      baixo: "Estoque Baixo",
      indisponivel: "Indisponível",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">
          ESTOQUE DE TECIDOS
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Layers className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold font-mono">{totalEstoque.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground">Total Estoque (Kg)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Lock className="w-5 h-5 mx-auto mb-1 text-[hsl(38,92%,50%)]" />
            <p className="text-2xl font-bold font-mono">{totalReservado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">Reservado (Kg)</p>
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
            <p className="text-lg font-bold font-mono text-primary">
              R$ {totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Valor Total Estoque</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, cor, cliente ou composição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
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
                  <th className="text-right py-3 px-4 font-semibold">Reservado (Kg)</th>
                  <th className="text-right py-3 px-4 font-semibold">Disponível (Kg)</th>
                  <th className="text-right py-3 px-4 font-semibold">Preço/Kg (R$)</th>
                  <th className="text-center py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const reservado = getEstoqueReservado(t.id);
                  const disponivel = getEstoqueDisponivel(t.id);
                  const statusAtual = getStatusEstoque(t.id);
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{t.nome}</td>
                      <td className="py-3 px-4 text-muted-foreground">{t.composicao}</td>
                      <td className="py-3 px-4">{t.cor}</td>
                      <td className="py-3 px-4">{t.cliente}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">{t.estoqueKg.toLocaleString("pt-BR")}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {reservado > 0 ? (
                          <span className="text-[hsl(38,92%,50%)] font-semibold">{reservado.toFixed(2)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-primary">{disponivel.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono">{t.precoKg.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">{statusBadge(statusAtual)}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground text-sm">
                      Nenhum tecido encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={4} className="py-3 px-4 text-right">Totais:</td>
                  <td className="py-3 px-4 text-right font-mono">
                    {filtered.reduce((s, t) => s + t.estoqueKg, 0).toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[hsl(38,92%,50%)]">
                    {filtered.reduce((s, t) => s + getEstoqueReservado(t.id), 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-primary font-bold">
                    {filtered.reduce((s, t) => s + getEstoqueDisponivel(t.id), 0).toFixed(2)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reservas Ativas */}
      {reservasAtivas.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="bg-[hsl(38,92%,50%/0.1)] px-4 py-2 border-b">
              <h3 className="text-xs font-bold flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[hsl(38,92%,50%)]" />
                Reservas Ativas ({reservasAtivas.length})
              </h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2 px-4 font-semibold">Ordem de Corte</th>
                  <th className="text-left py-2 px-4 font-semibold">Tecido</th>
                  <th className="text-right py-2 px-4 font-semibold">Reservado (Kg)</th>
                  <th className="text-left py-2 px-4 font-semibold">Data Reserva</th>
                </tr>
              </thead>
              <tbody>
                {reservasAtivas.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 px-4 font-mono font-semibold text-primary">{r.ordemCorte}</td>
                    <td className="py-2 px-4">{r.tecidoNome}</td>
                    <td className="py-2 px-4 text-right font-mono font-semibold text-[hsl(38,92%,50%)]">
                      {r.quantidadeReservadaKg.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 font-mono">{r.dataReserva}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Baixas */}
      {reservasConfirmadas.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="bg-[hsl(142,71%,35%/0.1)] px-4 py-2 border-b">
              <h3 className="text-xs font-bold flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-[hsl(142,71%,35%)]" />
                Histórico de Baixas ({reservasConfirmadas.length})
              </h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2 px-4 font-semibold">Ordem de Corte</th>
                  <th className="text-left py-2 px-4 font-semibold">Tecido</th>
                  <th className="text-right py-2 px-4 font-semibold">Consumo (Kg)</th>
                  <th className="text-right py-2 px-4 font-semibold">Perda (Kg)</th>
                  <th className="text-left py-2 px-4 font-semibold">Data Baixa</th>
                </tr>
              </thead>
              <tbody>
                {reservasConfirmadas.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 px-4 font-mono font-semibold text-primary">{r.ordemCorte}</td>
                    <td className="py-2 px-4">{r.tecidoNome}</td>
                    <td className="py-2 px-4 text-right font-mono">{r.quantidadeReservadaKg.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right font-mono text-destructive">{r.perdaRealKg?.toFixed(2) ?? "—"}</td>
                    <td className="py-2 px-4 font-mono">{r.dataConfirmacao ?? "—"}</td>
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
