import { useEffect, useState } from "react";
import { formatDateBR } from "@/lib/utils";
import { PageLoading } from "@/components/shared/PageLoading";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Printer, ArrowLeft, Shirt } from "lucide-react";

interface PedidoData {
  numero_pedido: string;
  modelo_ref: string;
  cliente: string | null;
  tecido: string | null;
  cor: string | null;
  data_pedido: string;
  status_kanban: string;
  piloto_entregue: boolean | null;
  consumo_tecido: number | null;
}

interface ModeloData {
  id: string;
  referencia: string;
  modelo: string | null;
  descricao: string | null;
  tecido_principal: string | null;
  consumo_metros: number | null;
  consumo_gramas: number | null;
  entretela: boolean | null;
  entretela_descricao: string | null;
  entretela_quantidade: number | null;
  forro_tecido2: boolean | null;
  forro_tecido2_descricao: string | null;
  forro_tecido2_quantidade: number | null;
  imagem_url: string | null;
  arquivo_modelagem_url: string | null;
}

const yellowReadonly =
  "h-9 w-full flex items-center px-3 rounded-md border bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] text-sm";

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{label}</Label>
      <div className={yellowReadonly}>
        <span className="truncate">{value ?? "—"}</span>
      </div>
    </div>
  );
}

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  em_corte: "Em Corte",
  em_producao: "Em Produção",
  recebido: "Recebido",
  entregue: "Entregue",
};

export default function FichaPedidoPage() {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<PedidoData | null>(null);
  const [modelo, setModelo] = useState<ModeloData | null>(null);
  const [aviamentos, setAviamentos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [gradacao, setGradacao] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!numero) return;
    (async () => {
      setLoading(true);
      const { data: pData } = await supabase
        .from("modelo_pedidos")
        .select("*")
        .eq("numero_pedido", numero)
        .limit(1)
        .maybeSingle();

      if (!pData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPedido(pData as any);

      const { data: mData } = await supabase
        .from("modelos")
        .select("*")
        .eq("referencia", pData.modelo_ref)
        .limit(1)
        .maybeSingle();

      // Aviamentos por pedido (preferencial). Fallback para aviamentos do modelo.
      const { data: avsPedido } = await supabase
        .from("aviamentos_pedido" as any)
        .select("*")
        .eq("numero_pedido", numero);

      if (avsPedido && avsPedido.length > 0) {
        setAviamentos(
          avsPedido.map((a: any) => ({
            descricao: a.descricao_item,
            unidade: a.tipo,
            quantidade: a.partes_qtde,
          }))
        );
      }

      if (mData) {
        setModelo(mData as any);
        const promises: any[] = [
          supabase.from("modelo_servicos" as any).select("*").eq("modelo_id", mData.id).order("ordem"),
        ];
        if (!avsPedido || avsPedido.length === 0) {
          promises.push(
            supabase.from("modelo_aviamentos" as any).select("*").eq("modelo_id", mData.id).order("ordem")
          );
        }
        const results = await Promise.all(promises);
        setServicos(results[0].data || []);
        if (results[1]) setAviamentos(results[1].data || []);
      }

      // Gradação por pedido (preferencial). Fallback para gradação do modelo se não houver.
      const { data: grsPedido } = await supabase
        .from("modelo_gradacao" as any)
        .select("*")
        .eq("numero_pedido", numero)
        .order("ordem");

      if (grsPedido && grsPedido.length > 0) {
        setGradacao(grsPedido);
      } else if (mData) {
        const { data: grsModelo } = await supabase
          .from("modelo_gradacao" as any)
          .select("*")
          .eq("modelo_id", mData.id)
          .order("ordem");
        setGradacao(grsModelo || []);
      }

      setLoading(false);
    })();
  }, [numero]);

  if (loading) {
    return <PageLoading message="Carregando ficha..." />;
  }

  if (notFound || !pedido) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Pedido não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/pedidos")}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
      </div>
    );
  }

  const custoTotalServicos = servicos.reduce(
    (sum, s) => sum + (Number(s.valor_unitario) || 0),
    0
  );

  return (
    <div className="p-4 md:p-6 space-y-4 print:p-2 max-w-[1200px] mx-auto">
      {/* Action bar */}
      <div className="flex justify-between items-center print:hidden">
        <Button variant="outline" size="sm" onClick={() => navigate("/pedidos")}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
        </Button>
      </div>

      {/* Header */}
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">
          FICHA DE PEDIDO — {pedido.numero_pedido}
        </h1>
      </div>

      {/* Header fields */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Field label="Referência" value={pedido.modelo_ref} />
            <Field label="Modelo" value={modelo?.modelo || modelo?.descricao} />
            <div className="col-span-2">
              <Field label="Nº de Pedido" value={pedido.numero_pedido} />
            </div>
            <Field label="Tecido" value={pedido.tecido || modelo?.tecido_principal} />
            <Field label="Cor" value={pedido.cor} />
            <Field label="Cliente" value={pedido.cliente} />
            <Field
              label="Piloto Entregue?"
              value={pedido.piloto_entregue === true ? "SIM" : pedido.piloto_entregue === false ? "NÃO" : "—"}
            />
            <Field
              label="Data do Pedido"
              value={pedido.data_pedido ? formatDateBR(pedido.data_pedido) : null}
            />
            <Field label="Status" value={statusLabel[pedido.status_kanban] || pedido.status_kanban} />
          </div>
        </CardContent>
      </Card>

      {/* Imagem + Aviamentos/Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card className="flex items-center justify-center min-h-[280px] overflow-hidden">
            {modelo?.imagem_url ? (
              <img src={modelo.imagem_url} alt="Modelo" className="w-full h-full object-contain p-2 max-h-[400px]" />
            ) : (
              <div className="text-center text-muted-foreground space-y-2 py-8">
                <Shirt className="w-16 h-16 mx-auto opacity-30" />
                <p className="text-sm">Sem imagem</p>
              </div>
            )}
          </Card>
          {modelo?.arquivo_modelagem_url && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-bold mb-2">ARQUIVO MODELAGEM APROVADA</h3>
                <a
                  href={modelo.arquivo_modelagem_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline break-all"
                >
                  {modelo.arquivo_modelagem_url.split("/").pop()}
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {/* Aviamentos */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">AVIAMENTOS</h3>
            </div>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 font-semibold">DESCRIÇÃO</th>
                    <th className="text-center py-2 px-3 font-semibold w-20">UNIDADE</th>
                    <th className="text-center py-2 px-3 font-semibold w-24">QTDE</th>
                  </tr>
                </thead>
                <tbody>
                  {aviamentos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted-foreground py-4">Sem aviamentos cadastrados</td>
                    </tr>
                  ) : (
                    aviamentos.map((a, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5 px-3">{a.descricao || "—"}</td>
                        <td className="py-1.5 px-3 text-center">{a.unidade || "—"}</td>
                        <td className="py-1.5 px-3 text-center font-mono">{a.quantidade || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Serviços */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">SERVIÇOS</h3>
            </div>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 font-semibold">DESCRIÇÃO</th>
                    <th className="text-center py-2 px-3 font-semibold w-28">CUSTO P/ PEÇA (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {servicos.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center text-muted-foreground py-4">Sem serviços</td>
                    </tr>
                  ) : (
                    servicos.map((s, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5 px-3">{s.descricao || "—"}</td>
                        <td className="py-1.5 px-3 text-center font-mono">
                          {Number(s.valor_unitario || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-muted/30">
                    <td className="py-2 px-3 font-bold text-right">CUSTO TOTAL P/ PEÇA:</td>
                    <td className="py-2 px-3 text-center font-bold font-mono">
                      R$ {custoTotalServicos.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tecido da Piloto */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <h3 className="text-sm font-bold whitespace-nowrap">TECIDO DA PILOTO</h3>
            <div className="flex gap-4 flex-1 min-w-[280px]">
              <div className="flex-1">
                <Field
                  label="Consumo (Metros)"
                  value={
                    pedido.consumo_tecido
                      ? Number(pedido.consumo_tecido).toFixed(2)
                      : modelo?.consumo_metros
                      ? Number(modelo.consumo_metros).toFixed(2)
                      : null
                  }
                />
              </div>
              <div className="flex-1">
                <Field
                  label="Consumo (Gramas)"
                  value={modelo?.consumo_gramas ? Number(modelo.consumo_gramas).toFixed(2) : null}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entretela / Forro */}
      {(modelo?.entretela || modelo?.forro_tecido2) && (
        <Card>
          <CardContent className="p-4 space-y-3">
            {modelo?.entretela && (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-bold min-w-[160px]">Entretela</span>
                <div className="flex-1 min-w-[200px]">
                  <Field label="Descrição" value={modelo.entretela_descricao} />
                </div>
                <div className="w-28">
                  <Field label="Quantidade" value={modelo.entretela_quantidade} />
                </div>
              </div>
            )}
            {modelo?.entretela && modelo?.forro_tecido2 && <Separator />}
            {modelo?.forro_tecido2 && (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-bold min-w-[160px]">Forro / Tecido 2</span>
                <div className="flex-1 min-w-[200px]">
                  <Field label="Descrição" value={modelo.forro_tecido2_descricao} />
                </div>
                <div className="w-28">
                  <Field label="Quantidade" value={modelo.forro_tecido2_quantidade} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gradação — pivot: 1 linha por item, tamanhos em colunas */}
      {(() => {
        const SIZES = ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"] as const;
        // Agrupa por nome do item (observacao). Se não houver, usa "—"
        const grupos = new Map<string, Record<string, number | null>>();
        gradacao.forEach((g: any) => {
          const item = (g.observacao || "—").trim();
          if (!grupos.has(item)) grupos.set(item, {});
          const sizeKey = (g.tamanho || "").toUpperCase().trim();
          const valor =
            g.medida_a ?? g.medida_b ?? g.medida_c ?? g.medida_d ?? null;
          if (sizeKey) grupos.get(item)![sizeKey] = valor;
        });
        const linhas = Array.from(grupos.entries());

        return (
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">GRADAÇÃO DE AVIAMENTOS</h3>
            </div>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-2 font-semibold">DESCRIÇÃO</th>
                    {SIZES.map((s) => (
                      <th key={s} className="text-center py-2 px-1 font-semibold w-14">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhas.length === 0 ? (
                    <tr>
                      <td colSpan={SIZES.length + 1} className="text-center text-muted-foreground py-4">
                        Sem gradação
                      </td>
                    </tr>
                  ) : (
                    linhas.map(([item, vals], i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1 px-2 font-medium">{item}</td>
                        {SIZES.map((s) => {
                          const v = vals[s];
                          return (
                            <td key={s} className="py-1 px-1 text-center font-mono">
                              {v != null && Number(v) !== 0 ? Number(v) : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
