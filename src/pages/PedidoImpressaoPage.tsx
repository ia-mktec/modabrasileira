import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, History } from "lucide-react";
import { PedidoHistoricoDialog } from "@/components/shared/PedidoHistoricoDialog";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute } from "@/lib/permissions";
import { PageLoading } from "@/components/shared/PageLoading";
import { formatDateBR } from "@/lib/utils";

interface PedidoData {
  numero_pedido: string;
  modelo_ref: string;
  cliente: string | null;
  tecido: string | null;
  data_pedido: string;
  piloto_entregue: boolean | null;
  observacoes: string | null;
}

interface ModeloData {
  qtde_rolos: number | null;
  corte: string | null;
  risco: string | null;
  foto_cliente_1_url: string | null;
  foto_cliente_2_url: string | null;
  imagem_url: string | null;
  imagem_costas_url: string | null;
  tamanhos_grade: string | null;
  tecido_principal: string | null;
}

const SIZES = ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"] as const;

export default function PedidoImpressaoPage() {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<PedidoData | null>(null);
  const [modelo, setModelo] = useState<ModeloData | null>(null);
  const [loading, setLoading] = useState(true);
  const [histOpen, setHistOpen] = useState(false);
  const { roles } = useAuth();
  const canViewHistorico = canAccessRoute("/pedidos/historico", roles);

  useEffect(() => {
    if (!numero) return;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("modelo_pedidos")
        .select("numero_pedido,modelo_ref,cliente,tecido,data_pedido,piloto_entregue,observacoes")
        .eq("numero_pedido", numero)
        .maybeSingle();
      if (p) {
        setPedido(p as any);
        const { data: m } = await supabase
          .from("modelos")
          .select("qtde_rolos,corte,risco,foto_cliente_1_url,foto_cliente_2_url,imagem_url,imagem_costas_url,tamanhos_grade,tecido_principal")
          .eq("referencia", p.modelo_ref)
          .maybeSingle();
        if (m) setModelo(m as any);
      }
      setLoading(false);
    })();
  }, [numero]);

  if (loading) return <PageLoading message="Carregando..." />;
  if (!pedido) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Pedido não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/pedidos")}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
      </div>
    );
  }

  let gradeObj: Record<string, string> = {};
  try {
    gradeObj = modelo?.tamanhos_grade ? JSON.parse(modelo.tamanhos_grade) : {};
  } catch {
    gradeObj = {};
  }

  const corteSel = (modelo?.corte || "").toLowerCase();

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto print:p-0 print:max-w-none">
      {/* Action bar */}
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Button variant="outline" size="sm" onClick={() => navigate("/pedidos")}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          {canViewHistorico && (
            <Button variant="outline" size="sm" onClick={() => setHistOpen(true)}>
              <History className="w-4 h-4" /> Histórico do Pedido
            </Button>
          )}
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      <PedidoHistoricoDialog
        numeroPedido={pedido.numero_pedido}
        open={histOpen}
        onOpenChange={setHistOpen}
      />

      <div className="border border-foreground text-foreground text-sm bg-background">
        {/* Top header: PEDIDO | número | DATA | data | CLIENTE | cliente */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-foreground bg-muted font-bold text-center w-[90px] py-2 px-2">PEDIDO</td>
              <td className="border border-foreground font-mono font-bold text-base py-2 px-3">{pedido.numero_pedido}</td>
              <td className="border border-foreground bg-muted font-bold text-center w-[80px] py-2 px-2">DATA</td>
              <td className="border border-foreground text-center font-medium w-[130px] py-2 px-2">{formatDateBR(pedido.data_pedido)}</td>
              <td className="border border-foreground bg-muted font-bold text-center w-[90px] py-2 px-2">CLIENTE</td>
              <td className="border border-foreground font-bold py-2 px-3">{pedido.cliente || "—"}</td>
            </tr>
          </tbody>
        </table>

        {/* Body: fotos + tabela */}
        <div className="grid grid-cols-[1fr_1fr]">
          {/* Fotos do cliente */}
          <div className="border-r border-foreground p-2 grid grid-cols-2 gap-2">
            {[1, 2].map((slot) => {
              const url = slot === 1 ? modelo?.foto_cliente_1_url : modelo?.foto_cliente_2_url;
              return (
                <div key={slot} className="flex flex-col">
                  <div className="text-xs font-bold mb-1">FOTO CLIENTE {slot}</div>
                  <div className="border border-foreground bg-muted/30 flex items-center justify-center h-[320px] overflow-hidden">
                    {url ? (
                      <img src={url} alt={`Foto cliente ${slot}`} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem foto</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabela à direita */}
          <table className="w-full border-collapse text-sm">
            <tbody>
              {/* REF | valor | TECIDO | valor */}
              <tr>
                <td className="border border-foreground bg-muted font-bold text-center py-2 px-2 w-[120px]">REF</td>
                <td className="border border-foreground font-bold text-center py-2 px-2">{pedido.modelo_ref || "—"}</td>
                <td className="border border-foreground bg-muted font-bold text-center py-2 px-2 w-[100px]">TECIDO</td>
                <td className="border border-foreground font-bold text-center py-2 px-2">{pedido.tecido || modelo?.tecido_principal || "—"}</td>
              </tr>

              {/* GRADE DE TAMANHOS PEDIDO */}
              <tr>
                <td className="border border-foreground bg-muted font-bold text-center py-1 px-2" colSpan={4}>
                  GRADE DE TAMANHOS PEDIDO
                </td>
              </tr>
              <tr>
                <td className="border border-foreground p-0" colSpan={4}>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        {SIZES.map((s) => (
                          <td key={s} className="border border-foreground bg-muted/50 font-bold text-center py-1 px-1 text-xs">
                            {s}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        {SIZES.map((s) => {
                          const v = gradeObj[s.toLowerCase()];
                          return (
                            <td key={s} className="border border-foreground text-center font-mono py-2 px-1">
                              {v && Number(v) !== 0 ? v : ""}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* QTDE ROLOS */}
              <tr>
                <td className="border border-foreground bg-muted font-bold text-center py-2 px-2">QTDE ROLOS</td>
                <td className="border border-foreground text-center font-bold py-2 px-2" colSpan={3}>
                  {modelo?.qtde_rolos ? `${modelo.qtde_rolos} ROLOS` : "—"}
                </td>
              </tr>

              {/* PILOTO */}
              <tr>
                <td className="border border-foreground bg-muted font-bold text-center py-2 px-2">PILOTO</td>
                <td className="border border-foreground text-center font-bold py-2 px-2" colSpan={3}>
                  {pedido.piloto_entregue === true ? "SIM" : pedido.piloto_entregue === false ? "NÃO" : "—"}
                </td>
              </tr>

              {/* RISCO */}
              <tr>
                <td className="border border-foreground bg-muted font-bold text-center py-2 px-2">RISCO</td>
                <td className="border border-foreground text-center font-bold py-2 px-2" colSpan={3}>{modelo?.risco || ""}</td>
              </tr>

              {/* CORTE INTERNO / CORTE EXTERNO */}
              <tr>
                <td className="border border-foreground bg-muted font-bold text-center py-2 px-2" colSpan={2}>
                  CORTE INTERNO
                </td>
                <td className="border border-foreground bg-muted font-bold text-center py-2 px-2" colSpan={2}>
                  CORTE EXTERNO
                </td>
              </tr>
              <tr>
                <td className="border border-foreground text-center font-bold py-3 px-2" colSpan={2}>
                  {corteSel === "interno" ? "X" : ""}
                </td>
                <td className="border border-foreground text-center font-bold py-3 px-2" colSpan={2}>
                  {corteSel === "externo" ? "X" : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* OBS */}
        <table className="w-full border-collapse border-t border-foreground">
          <tbody>
            <tr>
              <td className="border border-foreground bg-muted font-bold align-top py-2 px-2 w-[80px]">OBS :</td>
              <td className="border border-foreground py-2 px-3 h-[120px] align-top whitespace-pre-wrap">
                {pedido.observacoes || ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
