import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Search, RefreshCw } from "lucide-react";

type Pedido = {
  numero_pedido: string;
  cliente: string | null;
  modelo_ref: string;
  data_pedido: string;
  tecido: string | null;
  cor: string | null;
  consumo_tecido: number | null;
  observacoes: string | null;
  status_kanban: string;
};

const COLUNAS: { key: string; label: string; color: string }[] = [
  { key: "pendente", label: "Pendente", color: "hsl(220,14%,40%)" },
  { key: "em_corte", label: "Em Corte", color: "hsl(38,92%,45%)" },
  { key: "em_producao", label: "Em Produção", color: "hsl(199,89%,40%)" },
  { key: "recebido", label: "Recebido", color: "hsl(142,50%,40%)" },
  { key: "entregue", label: "Entregue", color: "hsl(217,71%,45%)" },
];

export default function PedidosKanbanPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("modelo_pedidos")
      .select("*")
      .order("data_pedido", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar pedidos", description: error.message, variant: "destructive" });
    } else {
      setPedidos((data as Pedido[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const moverPedido = async (numero_pedido: string, novoStatus: string) => {
    const original = pedidos.find((p) => p.numero_pedido === numero_pedido);
    if (!original || original.status_kanban === novoStatus) return;
    setPedidos((prev) => prev.map((p) => p.numero_pedido === numero_pedido ? { ...p, status_kanban: novoStatus } : p));
    const { error } = await supabase
      .from("modelo_pedidos")
      .update({ status_kanban: novoStatus })
      .eq("numero_pedido", numero_pedido);
    if (error) {
      toast({ title: "Erro ao mover pedido", description: error.message, variant: "destructive" });
      setPedidos((prev) => prev.map((p) => p.numero_pedido === numero_pedido ? { ...p, status_kanban: original.status_kanban } : p));
    } else {
      toast({ title: "Pedido movido", description: `${numero_pedido} → ${COLUNAS.find(c => c.key === novoStatus)?.label}` });
    }
  };

  const filtered = pedidos.filter((p) =>
    !search ||
    p.numero_pedido.toLowerCase().includes(search.toLowerCase()) ||
    (p.modelo_ref || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.cliente || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">KANBAN DE PEDIDOS</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº pedido, modelo ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {COLUNAS.map((col) => {
          const pedidosCol = filtered.filter((p) => (p.status_kanban || "pendente") === col.key);
          return (
            <div
              key={col.key}
              className="flex flex-col gap-2 min-h-[400px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedId) {
                  moverPedido(draggedId, col.key);
                  setDraggedId(null);
                }
              }}
            >
              <div
                className="rounded-t-lg px-3 py-2 text-center text-sm font-bold text-white flex items-center justify-between"
                style={{ background: col.color }}
              >
                <span>{col.label}</span>
                <Badge variant="secondary" className="text-[10px]">{pedidosCol.length}</Badge>
              </div>
              <div className="flex-1 space-y-2 bg-muted/30 rounded-b-lg p-2 min-h-[300px]">
                {pedidosCol.map((p) => (
                  <Card
                    key={p.numero_pedido}
                    draggable
                    onDragStart={() => setDraggedId(p.numero_pedido)}
                    onDragEnd={() => setDraggedId(null)}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3 space-y-1">
                      <div className="font-mono text-xs font-bold text-primary truncate">{p.numero_pedido}</div>
                      <div className="text-xs font-semibold truncate">{p.modelo_ref}</div>
                      {p.cliente && <div className="text-[11px] text-muted-foreground truncate">{p.cliente}</div>}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {p.tecido && <Badge variant="outline" className="text-[9px]">{p.tecido}</Badge>}
                        {p.cor && <Badge variant="outline" className="text-[9px]">{p.cor}</Badge>}
                      </div>
                      <div className="text-[10px] text-muted-foreground pt-1">
                        {new Date(p.data_pedido).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1 print:hidden">
                        {COLUNAS.filter(c => c.key !== col.key).map((c) => (
                          <Button
                            key={c.key}
                            size="sm"
                            variant="ghost"
                            className="h-5 px-1.5 text-[9px]"
                            onClick={() => moverPedido(p.numero_pedido, c.key)}
                          >
                            → {c.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pedidosCol.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-6">Nenhum pedido</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
