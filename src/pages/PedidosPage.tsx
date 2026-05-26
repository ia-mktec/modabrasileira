import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateBR } from "@/lib/utils";
import { PageLoading } from "@/components/shared/PageLoading";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PedidoTimeline } from "@/components/shared/PedidoTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { useEntityOptions, STATUS_PEDIDO_OPTIONS, PILOTO_OPTIONS } from "@/hooks/useEntityOptions";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight, FileText, Trash2, Pencil, Printer } from "lucide-react";
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
import { showSaving } from "@/lib/saving-toast";


interface PedidoRow {
  numero_pedido: string;
  modelo_ref: string;
  cliente: string | null;
  tecido: string | null;
  cor: string | null;
  status_kanban: string;
  data_pedido: string;
  consumo_tecido: number | null;
  observacoes: string | null;
  piloto_entregue: boolean | null;
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
  const canEdit = hasRole("modelagem") || hasRole("dev");

  const [editingPedido, setEditingPedido] = useState<PedidoRow | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { clientes: clienteOptions, tecidos: tecidoOptions, cores: corOptions } = useEntityOptions();
  const loadPedidos = async () => {
    setLoading(true);
    const all: PedidoRow[] = [];
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("modelo_pedidos")
        .select("numero_pedido,modelo_ref,cliente,tecido,cor,status_kanban,data_pedido,consumo_tecido,observacoes,piloto_entregue")
        .order("data_pedido", { ascending: false })
        .range(from, from + step - 1);
      if (error || !data || data.length === 0) break;
      all.push(...data);
      if (data.length < step) break;
      from += step;
    }
    const seen = new Set<string>();
    const unique = all.filter((p) => {
      if (seen.has(p.numero_pedido)) return false;
      seen.add(p.numero_pedido);
      return true;
    });
    unique.sort((a, b) => {
      const da = a.data_pedido || "";
      const db = b.data_pedido || "";
      if (da !== db) return db.localeCompare(da);
      return (b.numero_pedido || "").localeCompare(a.numero_pedido || "");
    });
    setPedidos(unique);
    setLoading(false);
  };

  useEffect(() => {
    loadPedidos();
    // Recarrega ao voltar para a aba (após editar em outra tela)
    const onVisible = () => {
      if (document.visibilityState === "visible") loadPedidos();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", loadPedidos);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", loadPedidos);
    };
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

  const handleDelete = async () => {
    if (!pedidoToDelete) return;
    setDeleting(true);

    // Bloquear exclusão se já existe ordem de corte vinculada
    const { count: ocCount, error: ocErr } = await supabase
      .from("ordens_corte")
      .select("id", { count: "exact", head: true })
      .eq("numero_pedido", pedidoToDelete);
    if (ocErr) {
      setDeleting(false);
      toast({ title: "Erro ao verificar ordem de corte", description: ocErr.message, variant: "destructive" });
      return;
    }
    if ((ocCount ?? 0) > 0) {
      setDeleting(false);
      toast({
        title: "Não é possível excluir",
        description: "Este pedido já possui ordem de corte vinculada.",
        variant: "destructive",
      });
      setPedidoToDelete(null);
      return;
    }

    const { error } = await supabase
      .from("modelo_pedidos")
      .delete()
      .eq("numero_pedido", pedidoToDelete);
    setDeleting(false);
    if (error) {
      toast({ title: "Erro ao excluir pedido", description: error.message, variant: "destructive" });
      return;
    }
    setPedidos((prev) => prev.filter((p) => p.numero_pedido !== pedidoToDelete));
    toast({ title: "Pedido excluído", description: `${pedidoToDelete} foi removido.` });
    setPedidoToDelete(null);
  };

  const navigate = useNavigate();

  // Abre a tela completa de Modelos no modo edição, com todos os dados do
  // pedido pré-carregados (incluindo aviamentos, gradação, etc.).
  const handleOpenEdit = (pedido: PedidoRow) => {
    navigate("/modelos", { state: { editPedido: pedido } });
  };


  const handleSaveEdit = async () => {
    if (!editingPedido) return;
    setSaving(true);
    const dismissSaving = showSaving();

    const { error } = await supabase
      .from("modelo_pedidos")
      .update({
        cliente: editingPedido.cliente,
        tecido: editingPedido.tecido,
        cor: editingPedido.cor,
        status_kanban: editingPedido.status_kanban,
        consumo_tecido: editingPedido.consumo_tecido,
        observacoes: editingPedido.observacoes,
        piloto_entregue: editingPedido.piloto_entregue,
        updated_at: new Date().toISOString(),
      })
      .eq("numero_pedido", editingPedido.numero_pedido);

    dismissSaving();
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }

    setPedidos((prev) =>
      prev.map((p) => (p.numero_pedido === editingPedido.numero_pedido ? editingPedido : p))
    );
    toast({ title: "Pedido atualizado", description: `${editingPedido.numero_pedido} foi salvo.` });
    setEditDialogOpen(false);
    setEditingPedido(null);
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
                    <TableCell colSpan={7}>
                      <PageLoading fullPage={false} />
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
                        {formatDateBR(p.data_pedido)}
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
                        <div className="flex justify-end gap-2">
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() =>
                              window.open(`/pedidos/${encodeURIComponent(p.numero_pedido)}/impressao`, "_blank")
                            }
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Imprimir
                          </Button>
                          {canEdit && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => handleOpenEdit(p)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => setPedidoToDelete(p.numero_pedido)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </Button>
                          )}
                        </div>
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

      <AlertDialog open={!!pedidoToDelete} onOpenChange={(o) => !o && setPedidoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido {pedidoToDelete}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os registros do pedido serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Pedido {editingPedido?.numero_pedido}</DialogTitle>
          </DialogHeader>
          {editingPedido && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cliente</Label>
                  <SearchableSelect
                    options={clienteOptions}
                    value={editingPedido.cliente}
                    onChange={(v) => setEditingPedido({ ...editingPedido, cliente: v })}
                    placeholder="Selecione cliente"
                    searchPlaceholder="Buscar cliente..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tecido</Label>
                  <SearchableSelect
                    options={tecidoOptions}
                    value={editingPedido.tecido}
                    onChange={(v) => setEditingPedido({ ...editingPedido, tecido: v })}
                    placeholder="Selecione tecido"
                    searchPlaceholder="Buscar tecido..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cor</Label>
                  <SearchableSelect
                    options={corOptions}
                    value={editingPedido.cor}
                    onChange={(v) => setEditingPedido({ ...editingPedido, cor: v })}
                    placeholder="Selecione cor"
                    searchPlaceholder="Buscar cor..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Consumo Tecido (m)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingPedido.consumo_tecido ?? ""}
                    onChange={(e) =>
                      setEditingPedido({
                        ...editingPedido,
                        consumo_tecido: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <SearchableSelect
                    options={STATUS_PEDIDO_OPTIONS}
                    value={editingPedido.status_kanban}
                    onChange={(v) => setEditingPedido({ ...editingPedido, status_kanban: v || "pendente" })}
                    placeholder="Selecione status"
                    searchPlaceholder="Buscar status..."
                    allowClear={false}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Piloto Entregue</Label>
                  <SearchableSelect
                    options={PILOTO_OPTIONS}
                    value={
                      editingPedido.piloto_entregue === true
                        ? "true"
                        : editingPedido.piloto_entregue === false
                          ? "false"
                          : null
                    }
                    onChange={(v) =>
                      setEditingPedido({
                        ...editingPedido,
                        piloto_entregue: v === "true" ? true : v === "false" ? false : null,
                      })
                    }
                    placeholder="Selecione"
                    searchPlaceholder="Buscar..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Observações</Label>
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={editingPedido.observacoes || ""}
                  onChange={(e) =>
                    setEditingPedido({ ...editingPedido, observacoes: e.target.value || null })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
