import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scissors, Truck, PackageCheck, Send } from "lucide-react";

const TAMANHOS = ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"];

interface ConsultaProdutoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    ordemNumero: string;
    referencia: string;
    descricao: string;
    cliente: string;
    qtdCortada: number;
    status: string;
    precoPeca: number;
    dataPrevisao: string;
    area: string;
  } | null;
  imagemSrc?: string;
}

const readOnlyInput = "bg-muted text-foreground border-border cursor-default text-xs h-8";

// Mock data for the consultation (simulating data from each stage)
function getMockCorteData(item: ConsultaProdutoDialogProps["item"]) {
  if (!item) return null;
  return {
    numero: item.ordemNumero,
    modeloRef: item.referencia,
    tecido: item.referencia.includes("001") ? "Malha Cotton 30/1" : item.referencia.includes("002") ? "Piquet PA" : item.referencia.includes("003") ? "Moletom Flanelado" : item.referencia.includes("004") ? "Viscolycra" : "Jeans Denim 10oz",
    dataCorte: "2025-02-20",
    cortador: "Carlos Silva",
    enfestos: 12,
    perdaPercent: 3.2,
    status: item.status,
    grade: [
      { cor: "Preto", quantidades: { PP: 0, P: 15, M: 20, G: 18, GG: 10, G1: 0, G2: 0, G3: 0 } },
      { cor: "Branco", quantidades: { PP: 0, P: 12, M: 18, G: 15, GG: 8, G1: 0, G2: 0, G3: 0 } },
    ],
    aviamentos: [
      { descricao: "Elástico 08mm", quantidade: 50 },
      { descricao: "Botão Tingido 18", quantidade: 200 },
      { descricao: "Etiqueta interna", quantidade: item.qtdCortada },
    ],
  };
}

function getMockExpedicaoData(item: ConsultaProdutoDialogProps["item"]) {
  if (!item) return null;
  return {
    dataSaida: "2025-02-22",
    oficina: "Têxtil Brasil Ltda",
    destino: item.cliente,
    notaFiscal: "NF-00456",
    statusExpedicao: "expedido",
    preco: item.precoPeca.toFixed(2),
    grade: [
      { cor: "Preto", qtdProduzida: { PP: 0, P: 15, M: 20, G: 18, GG: 10, G1: 0, G2: 0, G3: 0 }, qtdExpedida: { PP: 0, P: 15, M: 20, G: 18, GG: 10, G1: 0, G2: 0, G3: 0 } },
      { cor: "Branco", qtdProduzida: { PP: 0, P: 12, M: 18, G: 15, GG: 8, G1: 0, G2: 0, G3: 0 }, qtdExpedida: { PP: 0, P: 12, M: 18, G: 15, GG: 8, G1: 0, G2: 0, G3: 0 } },
    ],
  };
}

function getMockRecebimentoData(item: ConsultaProdutoDialogProps["item"]) {
  if (!item) return null;
  return {
    oficina: "Têxtil Brasil Ltda",
    dataEnvio: "2025-02-22",
    dataRecebimento: "2025-02-26",
    dias: 4,
    totalSemDefeitos: item.qtdCortada - 3,
    defeitos: 3,
    totalPagar: (item.qtdCortada * item.precoPeca).toFixed(2),
  };
}

function getMockEntregaData(item: ConsultaProdutoDialogProps["item"]) {
  if (!item) return null;
  return {
    dataEntrega: item.dataPrevisao,
    tempoProducao: "12 dias",
    qtdEntregue: item.qtdCortada - 3,
    segundaQualidade: 2,
    oficina: "Têxtil Brasil Ltda",
  };
}

function SectionHeader({ title, icon: Icon, color }: { title: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: color }}>
        <Icon className="w-4 h-4 text-[hsl(0,0%,100%)]" />
      </div>
      <h3 className="text-sm font-bold tracking-wide">{title}</h3>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Input value={String(value)} readOnly className={readOnlyInput} />
    </div>
  );
}

export function ConsultaProdutoDialog({ open, onOpenChange, item, imagemSrc }: ConsultaProdutoDialogProps) {
  if (!item) return null;

  const corte = getMockCorteData(item);
  const expedicao = getMockExpedicaoData(item);
  const recebimento = getMockRecebimentoData(item);
  const entrega = getMockEntregaData(item);

  const totalBySize = (grade: { quantidades: Record<string, number> }[], tam: string) =>
    grade.reduce((s, r) => s + (r.quantidades[tam] || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] px-6 py-3 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-[hsl(0,0%,100%)] text-lg font-bold font-mono tracking-wide text-center">
              CONSULTA DE PRODUTO — {item.referencia}
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[calc(90vh-60px)]">
          <div className="p-5 space-y-5">
            {/* Product Summary + Image */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
              <Card>
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <ReadOnlyField label="Nº Ordem" value={item.ordemNumero} />
                    <ReadOnlyField label="Referência" value={item.referencia} />
                    <ReadOnlyField label="Descrição" value={item.descricao} />
                    <ReadOnlyField label="Cliente" value={item.cliente} />
                    <ReadOnlyField label="Qtd Cortada" value={item.qtdCortada} />
                    <ReadOnlyField label="Preço/Peça" value={`R$ ${item.precoPeca.toFixed(2)}`} />
                    <ReadOnlyField label="Data Prevista" value={new Date(item.dataPrevisao).toLocaleDateString("pt-BR")} />
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</Label>
                      <div className="h-8 flex items-center">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Image */}
              <Card className="overflow-hidden">
                <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-2 py-1">
                  <p className="text-[10px] font-bold text-center tracking-wide">IMAGEM REF.</p>
                </div>
                <CardContent className="p-1">
                  {imagemSrc ? (
                    <img src={imagemSrc} alt={item.descricao} className="w-full h-40 object-cover rounded" />
                  ) : (
                    <div className="w-full h-40 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                      Sem imagem
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* ===== CORTE ===== */}
            <div>
              <SectionHeader title="CORTE" icon={Scissors} color="hsl(217 71% 45%)" />
              <Card>
                <CardContent className="p-3 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <ReadOnlyField label="Tecido" value={corte?.tecido || "—"} />
                    <ReadOnlyField label="Data Corte" value={corte?.dataCorte ? new Date(corte.dataCorte).toLocaleDateString("pt-BR") : "—"} />
                    <ReadOnlyField label="Cortador" value={corte?.cortador || "—"} />
                    <ReadOnlyField label="Enfestos" value={corte?.enfestos || 0} />
                    <ReadOnlyField label="Perda (%)" value={corte?.perdaPercent || 0} />
                  </div>

                  {/* Grade */}
                  {corte?.grade && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="px-2 py-1 text-left font-semibold w-20">COR</th>
                            {TAMANHOS.map((t) => (
                              <th key={t} className="px-1 py-1 text-center font-semibold w-10">{t}</th>
                            ))}
                            <th className="px-2 py-1 text-center font-semibold">TOTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {corte.grade.map((row, i) => {
                            const rowTotal = TAMANHOS.reduce((s, t) => s + ((row.quantidades as any)[t] || 0), 0);
                            return (
                              <tr key={i} className="border-b">
                                <td className="px-2 py-1 font-medium">{row.cor}</td>
                                {TAMANHOS.map((t) => (
                                  <td key={t} className="px-1 py-1 text-center">
                                    <span className="bg-muted rounded px-1 py-0.5 font-mono">{(row.quantidades as any)[t] || 0}</span>
                                  </td>
                                ))}
                                <td className="px-2 py-1 text-center font-bold">{rowTotal}</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-muted/50 font-bold">
                            <td className="px-2 py-1">Total</td>
                            {TAMANHOS.map((t) => (
                              <td key={t} className="px-1 py-1 text-center">{totalBySize(corte.grade, t)}</td>
                            ))}
                            <td className="px-2 py-1 text-center">
                              {TAMANHOS.reduce((s, t) => s + totalBySize(corte.grade, t), 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Aviamentos */}
                  {corte?.aviamentos && corte.aviamentos.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Aviamentos</p>
                      <div className="grid grid-cols-3 gap-1">
                        {corte.aviamentos.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 bg-muted rounded px-2 py-1 text-[11px]">
                            <span className="flex-1">{a.descricao}</span>
                            <span className="font-mono font-semibold">{a.quantidade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* ===== EXPEDIÇÃO ===== */}
            <div>
              <SectionHeader title="EXPEDIÇÃO" icon={Truck} color="hsl(38 92% 50%)" />
              <Card>
                <CardContent className="p-3 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <ReadOnlyField label="Data Saída" value={expedicao?.dataSaida ? new Date(expedicao.dataSaida).toLocaleDateString("pt-BR") : "—"} />
                    <ReadOnlyField label="Oficina" value={expedicao?.oficina || "—"} />
                    <ReadOnlyField label="Destino" value={expedicao?.destino || "—"} />
                    <ReadOnlyField label="Nota Fiscal" value={expedicao?.notaFiscal || "—"} />
                    <ReadOnlyField label="Preço (R$)" value={expedicao?.preco || "—"} />
                  </div>

                  {/* Grade Produzida x Expedida */}
                  {expedicao?.grade && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="px-2 py-1 text-left font-semibold w-20">COR</th>
                            <th className="px-1 py-1 text-left font-semibold w-10">TIPO</th>
                            {TAMANHOS.map((t) => (
                              <th key={t} className="px-1 py-1 text-center font-semibold w-10">{t}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {expedicao.grade.map((row, i) => (
                            <>
                              <tr key={`p-${i}`} className="border-b border-dashed">
                                <td className="px-2 py-1 font-medium" rowSpan={2}>{row.cor}</td>
                                <td className="px-1 py-0.5 text-[10px] text-muted-foreground">Prod</td>
                                {TAMANHOS.map((t) => (
                                  <td key={t} className="px-1 py-0.5 text-center">
                                    <span className="bg-muted rounded px-1 font-mono">{(row.qtdProduzida as any)[t] || 0}</span>
                                  </td>
                                ))}
                              </tr>
                              <tr key={`e-${i}`} className="border-b">
                                <td className="px-1 py-0.5 text-[10px] text-primary font-semibold">Exp</td>
                                {TAMANHOS.map((t) => (
                                  <td key={t} className="px-1 py-0.5 text-center">
                                    <span className="bg-primary/10 text-primary rounded px-1 font-mono font-semibold">{(row.qtdExpedida as any)[t] || 0}</span>
                                  </td>
                                ))}
                              </tr>
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* ===== RECEBIMENTO ===== */}
            <div>
              <SectionHeader title="RECEBIMENTO" icon={PackageCheck} color="hsl(199 89% 48%)" />
              <Card>
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <ReadOnlyField label="Oficina" value={recebimento?.oficina || "—"} />
                    <ReadOnlyField label="Data Envio" value={recebimento?.dataEnvio ? new Date(recebimento.dataEnvio).toLocaleDateString("pt-BR") : "—"} />
                    <ReadOnlyField label="Data Recebimento" value={recebimento?.dataRecebimento ? new Date(recebimento.dataRecebimento).toLocaleDateString("pt-BR") : "—"} />
                    <ReadOnlyField label="Dias" value={recebimento?.dias || "—"} />
                    <ReadOnlyField label="Total s/ Defeitos" value={recebimento?.totalSemDefeitos || "—"} />
                    <ReadOnlyField label="Defeitos" value={recebimento?.defeitos || 0} />
                    <ReadOnlyField label="Total a Pagar" value={`R$ ${recebimento?.totalPagar || "0,00"}`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* ===== ENTREGA CLIENTE ===== */}
            <div>
              <SectionHeader title="ENTREGA CLIENTE" icon={Send} color="hsl(142 71% 35%)" />
              <Card>
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <ReadOnlyField label="Data de Entrega" value={entrega?.dataEntrega ? new Date(entrega.dataEntrega).toLocaleDateString("pt-BR") : "—"} />
                    <ReadOnlyField label="Tempo de Produção" value={entrega?.tempoProducao || "—"} />
                    <ReadOnlyField label="Qtd Entregue" value={entrega?.qtdEntregue || 0} />
                    <ReadOnlyField label="2ª Qualidade" value={entrega?.segundaQualidade || 0} />
                    <ReadOnlyField label="Oficina" value={entrega?.oficina || "—"} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
