import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PedidoTimeline } from "@/components/shared/PedidoTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, FileText, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";


interface PedidoRow {
  numero_pedido: string;
  modelo_ref: string;
  cliente: string | null;
  tecido: string | null;
  cor: string | null;
  status_kanban: string;
  data_pedido: string;
}

const statusOptions = [
  { value: "todos", label: "Todos os status" },
  { value: "pendente", label: "Pendente" },
  { value: "em_corte", label: "Em Corte" },
  { value: "em_producao", label: "Em Produção" },
  { value: "recebido", label: "Recebido" },
  { value: "entregue", label: "Entregue" },
];

const PAGE_SIZE = 50;

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pedidoToDelete, setPedidoToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { hasRole } = useAuth();
  const canDelete = hasRole("modelagem") || hasRole("dev");
  

  useEffect(() => {
    (async () => {
      setLoading(true);
      // fetch all in batches to avoid 1000 row limit
      const all: PedidoRow[] = [];
      let from = 0;
      const step = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("modelo_pedidos")
          .select("numero_pedido,modelo_ref,cliente,tecido,cor,status_kanban,data_pedido")
          .order("data_pedido", { ascending: false })
          .range(from, from + step - 1);
        if (error || !data || data.length === 0) break;
        all.push(...data);
        if (data.length < step) break;
        from += step;
      }
      // dedupe by numero_pedido (multiple rows per pedido)
      const seen = new Set<string>();
      const unique = all.filter((p) => {
        if (seen.has(p.numero_pedido)) return false;
        seen.add(p.numero_pedido);
        return true;
      });
      setPedidos(unique);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (statusFilter !== "todos" && p.status_kanban !== statusFilter) return false;
      if (!s) return true;
      return (
        p.numero_pedido.toLowerCase().includes(s) ||
        p.modelo_ref?.toLowerCase().includes(s) ||
        p.cliente?.toLowerCase().includes(s) ||
        p.tecido?.toLowerCase().includes(s) ||
        p.cor?.toLowerCase().includes(s)
      );
    });
  }, [pedidos, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleRowClick = (numero: string) => {
    setSelectedPedido(numero);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Pedidos"
        description={`${filtered.length} de ${pedidos.length} pedidos`}
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, referência, cliente, tecido ou cor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tecido / Cor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((p) => (
                    <TableRow
                      key={p.numero_pedido}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(p.numero_pedido)}
                    >
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {p.numero_pedido}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(p.data_pedido).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.modelo_ref}</TableCell>
                      <TableCell className="text-sm">{p.cliente || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {[p.tecido, p.cor].filter(Boolean).join(" • ") || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={p.status_kanban} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() =>
                            window.open(`/pedidos/${encodeURIComponent(p.numero_pedido)}/ficha`, "_blank")
                          }
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Ver Ficha
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PedidoTimeline
        numeroPedido={selectedPedido}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
