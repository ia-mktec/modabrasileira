import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PedidoTimelineProps {
  numeroPedido: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ETAPAS = [
  { key: "pendente", label: "Pendente" },
  { key: "em_corte", label: "Em Corte" },
  { key: "em_producao", label: "Em Produção" },
  { key: "recebido", label: "Recebido" },
  { key: "entregue", label: "Entregue" },
];

interface HistoricoRow {
  status_novo: string;
  status_anterior: string | null;
  created_at: string;
}

export function PedidoTimeline({ numeroPedido, open, onOpenChange }: PedidoTimelineProps) {
  const [historico, setHistorico] = useState<HistoricoRow[]>([]);
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !numeroPedido) return;
    setLoading(true);
    Promise.all([
      supabase.from("pedido_historico").select("status_novo,status_anterior,created_at")
        .eq("numero_pedido", numeroPedido).order("created_at", { ascending: true }),
      supabase.from("modelo_pedidos").select("*").eq("numero_pedido", numeroPedido).maybeSingle(),
    ]).then(([h, p]) => {
      setHistorico(h.data || []);
      setPedido(p.data || null);
      setLoading(false);
    });
  }, [open, numeroPedido]);

  // Mapeia última data de cada etapa
  const datasPorEtapa: Record<string, string> = {};
  historico.forEach((h) => {
    datasPorEtapa[h.status_novo] = h.created_at;
  });

  const statusAtual = pedido?.status_kanban || "pendente";
  const idxAtual = ETAPAS.findIndex((e) => e.key === statusAtual);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono">Pedido {numeroPedido}</DialogTitle>
          <DialogDescription>
            {pedido ? `${pedido.modelo_ref} • ${pedido.cliente || "—"}` : "Carregando..."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando histórico...</p>
        ) : (
          <div className="py-2">
            {ETAPAS.map((etapa, i) => {
              const data = datasPorEtapa[etapa.key];
              const concluida = i < idxAtual;
              const atual = i === idxAtual;
              const Icon = concluida ? CheckCircle2 : atual ? Clock : Circle;
              return (
                <div key={etapa.key} className="flex gap-3 items-start relative">
                  <div className="flex flex-col items-center">
                    <Icon className={cn(
                      "w-6 h-6 shrink-0",
                      concluida && "text-[hsl(142,71%,35%)]",
                      atual && "text-primary",
                      !concluida && !atual && "text-muted-foreground/40"
                    )} />
                    {i < ETAPAS.length - 1 && (
                      <div className={cn(
                        "w-0.5 h-10 my-1",
                        concluida ? "bg-[hsl(142,71%,35%)]" : "bg-border"
                      )} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={cn(
                      "text-sm font-medium",
                      atual && "text-primary",
                      !concluida && !atual && "text-muted-foreground"
                    )}>
                      {etapa.label}
                    </p>
                    {data ? (
                      <p className="text-xs text-muted-foreground">
                        {new Date(data).toLocaleString("pt-BR")}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/60">—</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
