import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetch-all-rows";
import { formatDateBR } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Loader2, ExternalLink } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  clienteId: string | null;
  clienteNome: string;
  tecido: string;
  cor: string;
  composicao: string;
}

interface AlocacaoRow {
  numero: string;
  modelo_ref: string | null;
  data_corte: string | null;
  status: string | null;
  metragem: number;
}

export function DetalhesAlocacaoDialog({
  open,
  onClose,
  clienteId,
  clienteNome,
  tecido,
  cor,
  composicao,
}: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AlocacaoRow[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      // 1) Entradas alocadas para o tecido/cor
      let q = supabase
        .from("tecido_entradas")
        .select("ordem_corte1,ordem_corte2,metragem_total,cliente_id,nome_tecido,cor,status")
        .ilike("status", "aloc%")
        .eq("nome_tecido", tecido);
      if (clienteId) q = q.eq("cliente_id", clienteId);
      if (cor && cor !== "—") q = q.eq("cor", cor);
      const { data: entradas } = await q;

      // Acumula metragem por número de OC
      const metragemPorOC = new Map<string, number>();
      (entradas || []).forEach((e: any) => {
        const m = Number(e.metragem_total || 0);
        [e.ordem_corte1, e.ordem_corte2].forEach((oc: any) => {
          const k = oc ? String(oc).trim() : "";
          if (!k) return;
          metragemPorOC.set(k, (metragemPorOC.get(k) || 0) + m);
        });
      });

      const numeros = Array.from(metragemPorOC.keys());
      if (numeros.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // 2) Detalhes das OCs
      const { data: ocs } = await fetchAllRows((from, to) =>
        supabase
          .from("ordens_corte")
          .select("numero,modelo_ref,data_corte,status")
          .in("numero", numeros)
          .range(from, to),
      );

      const ocMap = new Map<string, any>();
      (ocs || []).forEach((o: any) => ocMap.set(String(o.numero).trim(), o));

      const result: AlocacaoRow[] = numeros.map((numero) => {
        const oc = ocMap.get(numero);
        return {
          numero,
          modelo_ref: oc?.modelo_ref ?? null,
          data_corte: oc?.data_corte ?? null,
          status: oc?.status ?? null,
          metragem: metragemPorOC.get(numero) || 0,
        };
      }).sort((a, b) => (b.data_corte || "").localeCompare(a.data_corte || ""));

      setRows(result);
      setLoading(false);
    })();
  }, [open, clienteId, tecido, cor]);

  const total = rows.reduce((s, r) => s + r.metragem, 0);

  const abrirOC = (numero: string) => {
    onClose();
    navigate(`/corte?oc=${encodeURIComponent(numero)}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ordens alocadas</DialogTitle>
        </DialogHeader>

        <div className="text-xs text-muted-foreground border rounded-md p-3 bg-muted/30 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><span className="font-semibold text-foreground">Cliente:</span> {clienteNome}</div>
          <div><span className="font-semibold text-foreground">Tecido:</span> {tecido}</div>
          <div><span className="font-semibold text-foreground">Cor:</span> {cor}</div>
          <div><span className="font-semibold text-foreground">Composição:</span> {composicao || "—"}</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma ordem encontrada para este tecido.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold">OC</th>
                  <th className="text-left py-2 px-3 font-semibold">Modelo</th>
                  <th className="text-center py-2 px-3 font-semibold">Data Corte</th>
                  <th className="text-right py-2 px-3 font-semibold">Metragem (mt)</th>
                  <th className="text-center py-2 px-3 font-semibold">Status</th>
                  <th className="text-center py-2 px-3 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.numero} className="border-b hover:bg-muted/30">
                    <td className="py-2 px-3 font-mono">{r.numero}</td>
                    <td className="py-2 px-3">{r.modelo_ref || "—"}</td>
                    <td className="py-2 px-3 text-center font-mono">{formatDateBR(r.data_corte)}</td>
                    <td className="py-2 px-3 text-right font-mono">
                      {r.metragem.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-center capitalize">{r.status?.replace(/_/g, " ") || "—"}</td>
                    <td className="py-2 px-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => abrirOC(r.numero)}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> Abrir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={3} className="py-2 px-3 text-right">Total alocado:</td>
                  <td className="py-2 px-3 text-right font-mono">
                    {total.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
