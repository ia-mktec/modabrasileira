import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Props {
  numeroPedido: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

interface HistRow {
  id: string;
  created_at: string;
  changed_by: string | null;
  campo: string | null;
  valor_anterior: string | null;
  valor_novo: string | null;
  status_anterior: string | null;
  status_novo: string | null;
}

const CAMPO_LABEL: Record<string, string> = {
  criacao: "Criação do Pedido",
  status_kanban: "Status",
  modelo_ref: "Referência",
  cliente: "Cliente",
  tecido: "Tecido",
  cor: "Cor",
  data_pedido: "Data do Pedido",
  piloto_entregue: "Piloto Entregue",
  consumo_tecido: "Consumo de Tecido",
  observacoes: "Observações",
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_corte: "Em Corte",
  em_producao: "Em Produção",
  recebido: "Recebido",
  entregue: "Entregue",
};

function fmtValor(campo: string | null, v: string | null) {
  if (v == null || v === "") return "—";
  if (campo === "status_kanban") return STATUS_LABEL[v] ?? v;
  if (campo === "piloto_entregue") return v === "true" ? "SIM" : v === "false" ? "NÃO" : v;
  return v;
}

export function PedidoHistoricoDialog({ numeroPedido, open, onOpenChange }: Props) {
  const [rows, setRows] = useState<HistRow[]>([]);
  const [usuarios, setUsuarios] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !numeroPedido) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("pedido_historico")
        .select("*")
        .eq("numero_pedido", numeroPedido)
        .order("created_at", { ascending: false });
      const list = (data || []) as HistRow[];
      setRows(list);

      const uids = Array.from(new Set(list.map((r) => r.changed_by).filter(Boolean))) as string[];
      if (uids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,full_name,email")
          .in("id", uids);
        const map: Record<string, string> = {};
        (profs || []).forEach((p: any) => {
          map[p.id] = p.full_name || p.email || p.id;
        });
        setUsuarios(map);
      }
      setLoading(false);
    })();
  }, [open, numeroPedido]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-mono">Histórico do Pedido {numeroPedido}</DialogTitle>
          <DialogDescription>
            Todas as alterações registradas, com usuário, campo, valores e data.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando histórico...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma alteração registrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Para</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const campo = r.campo || (r.status_anterior || r.status_novo ? "status_kanban" : "—");
                  const isCriacao = campo === "criacao";
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.changed_by ? usuarios[r.changed_by] || "—" : "Sistema"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {isCriacao ? (
                          <Badge variant="secondary">Criação</Badge>
                        ) : (
                          CAMPO_LABEL[campo] ?? campo
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {isCriacao ? "—" : fmtValor(campo, r.valor_anterior ?? r.status_anterior)}
                      </TableCell>
                      <TableCell className="text-xs font-medium max-w-[200px] truncate">
                        {fmtValor(campo, r.valor_novo ?? r.status_novo)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
