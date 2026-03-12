import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ordensCorte, modelos } from "@/lib/mock-data";
import { Search, Printer, PackageCheck, ImageOff, Eraser, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { differenceInDays, parseISO } from "date-fns";

const TAMANHOS = ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"];

interface GradeRecRow {
  id: string;
  cor: string;
  qtdCortada: Record<string, number>;
  totalPecas: number;
  totalDefeitos: string;
  totalRecebido: string;
}

const RecebimentoPage = () => {
  // Consulta (read-only) - dados da ordem
  const [referencia, setReferencia] = useState("");
  const [ordemCorte, setOrdemCorte] = useState("");
  const [cliente, setCliente] = useState("");
  const [modelo, setModelo] = useState("");
  const [oficina, setOficina] = useState("");
  const [dataEnvio, setDataEnvio] = useState("");

  // Editáveis (amarelo)
  const [dataRecebimento, setDataRecebimento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [statusKanban, setStatusKanban] = useState("");

  // Imagem ref (cadastro modelo)
  const [refImage, setRefImage] = useState<string | null>(null);

  // Grade cortada
  const [gradeRows, setGradeRows] = useState<GradeRecRow[]>([]);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const filteredOrdens = ordensCorte.filter(
    (oc) =>
      oc.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oc.modeloRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusLabel = (s: string) => {
    switch (s) {
      case "pendente": return "Pendente";
      case "em_andamento": return "Em Andamento";
      case "concluido": return "Concluído";
      case "cancelado": return "Cancelado";
      default: return s;
    }
  };

  // Campos automáticos calculados
  const qtdRecebida = useMemo(() => {
    return gradeRows.reduce((sum, r) => sum + (parseInt(r.totalRecebido) || 0), 0);
  }, [gradeRows]);

  const defeitos = useMemo(() => {
    return gradeRows.reduce((sum, r) => sum + (parseInt(r.totalDefeitos) || 0), 0);
  }, [gradeRows]);

  const tempoProducao = useMemo(() => {
    if (!dataEnvio || !dataRecebimento) return "—";
    try {
      const dias = differenceInDays(parseISO(dataRecebimento), parseISO(dataEnvio));
      return `${dias} dia${dias !== 1 ? "s" : ""}`;
    } catch {
      return "—";
    }
  }, [dataEnvio, dataRecebimento]);

  const loadOrdem = (oc: typeof ordensCorte[0]) => {
    setReferencia(oc.modeloRef);
    setOrdemCorte(oc.numero);
    setCliente("Cliente Exemplo");
    const foundModelo = modelos.find(m => m.referencia === oc.modeloRef);
    setModelo(foundModelo?.descricao || oc.modeloRef);
    setOficina("Oficina Exemplo");
    setDataEnvio(oc.dataCorte);

    const cores = ["Preto", "Off", "Rosa"];
    const mockRows: GradeRecRow[] = cores.map((cor, i) => ({
      id: String(i + 1),
      cor,
      qtdCortada: Object.fromEntries(TAMANHOS.map((t, j) => [t, j >= 1 && j <= 3 ? Math.floor(oc.quantidadePecas / 15) : 0])),
      totalPecas: 0,
      totalDefeitos: "",
      totalRecebido: "",
    }));
    mockRows.forEach((r) => {
      r.totalPecas = TAMANHOS.reduce((s, t) => s + (r.qtdCortada[t] || 0), 0);
    });
    setGradeRows(mockRows);

    setRefImage(null);
    setSearchOpen(false);
    setIsLoaded(true);
    setDataRecebimento("");
    setObservacoes("");
    setStatusKanban("");
  };

  const handleSalvar = () => {
    if (!ordemCorte) {
      toast({ title: "Nenhuma ordem carregada", description: "Busque uma ordem primeiro.", variant: "destructive" });
      return;
    }
    if (!dataRecebimento) {
      toast({ title: "Campo obrigatório", description: "Preencha a data de recebimento.", variant: "destructive" });
      return;
    }
    toast({ title: "Recebimento salvo", description: `Recebimento da ordem ${ordemCorte} salvo com sucesso.` });
  };

  const handleLimpar = () => {
    setReferencia(""); setOrdemCorte(""); setCliente(""); setModelo("");
    setOficina(""); setDataEnvio(""); setDataRecebimento("");
    setObservacoes(""); setStatusKanban("");
    setGradeRows([]); setRefImage(null); setIsLoaded(false);
  };

  const handlePrint = useCallback(() => { window.print(); }, []);

  const updateGradeField = (rowId: string, field: "totalDefeitos" | "totalRecebido", val: string) =>
    setGradeRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: val } : r)));

  const yellowInput =
    "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";
  const readOnlyInput =
    "bg-muted text-foreground border-border cursor-default";

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">RECEBIMENTO DE PRODUTO</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Action Panel */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-3 md:w-40 shrink-0 print:hidden overflow-x-auto pb-2 md:pb-0">
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0">
                <Search className="w-4 h-4" />
                <span>Buscar Ordem</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Buscar Ordem de Corte</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Número ou modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {filteredOrdens.map((oc) => (
                    <button key={oc.id} onClick={() => loadOrdem(oc)} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                      <div className="font-mono text-xs font-semibold text-primary">{oc.numero}</div>
                      <div className="text-muted-foreground text-xs">{oc.modeloRef} — {oc.tecido}</div>
                      <div className="text-muted-foreground text-[10px]">{statusLabel(oc.status)} • {oc.quantidadePecas} peças</div>
                    </button>
                  ))}
                  {filteredOrdens.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ordem encontrada</p>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Separator className="hidden md:block" />

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)]"
            onClick={handleSalvar}
          >
            <Save className="w-4 h-4" />
            <span>Salvar Recebimento</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0"
              >
                <Eraser className="w-4 h-4" />
                <span>Limpar Recebimento</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar Recebimento</AlertDialogTitle>
                <AlertDialogDescription>
                  As informações não salvas serão excluídas permanentemente. Deseja continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLimpar}>Sim</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Separator className="hidden md:block" />

          <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </Button>
        </div>

        {/* Main Ficha Content */}
        <div className="flex-1 space-y-4">
          {/* Dados da Ordem — Consulta */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">DADOS DA ORDEM</h3>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Ordem de Corte</Label>
                  <Input value={ordemCorte} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Cliente</Label>
                  <Input value={cliente} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Referência</Label>
                  <Input value={referencia} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Modelo</Label>
                  <Input value={modelo} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Oficina</Label>
                  <Input value={oficina} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Data de Envio</Label>
                  <Input value={dataEnvio} readOnly className={readOnlyInput} placeholder="—" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados de Recebimento + Imagem */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-4">
            <Card>
              <div className="bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
                <h3 className="text-sm font-bold tracking-wide text-center">DADOS DE RECEBIMENTO</h3>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Data de Recebimento</Label>
                    <Input type="date" value={dataRecebimento} onChange={(e) => setDataRecebimento(e.target.value)} className={yellowInput} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tempo de Produção</Label>
                    <Input value={tempoProducao} readOnly className={readOnlyInput} placeholder="—" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Quantidade Recebida</Label>
                    <Input value={qtdRecebida > 0 ? String(qtdRecebida) : ""} readOnly className={readOnlyInput} placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Defeitos</Label>
                    <Input value={defeitos > 0 ? String(defeitos) : ""} readOnly className={readOnlyInput} placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={statusKanban} onValueChange={setStatusKanban}>
                      <SelectTrigger className={yellowInput}>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Imagem Referência */}
            <Card className="flex flex-col">
              <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-3 py-1.5 rounded-t-lg">
                <h3 className="text-xs font-bold tracking-wide text-center">IMAGEM REF.</h3>
              </div>
              <CardContent className="p-2 flex-1 flex flex-col items-center justify-center">
                {refImage ? (
                  <div className="w-full h-full min-h-[200px]">
                    <img src={refImage} alt="Referência do modelo" className="w-full h-full object-contain rounded" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                    <ImageOff className="w-10 h-10" />
                    <span className="text-xs">Imagem será carregada ao buscar uma ordem</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Grade Cortada */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">GRADE CORTADA</h3>
            </div>
            <CardContent className="p-3">
              {gradeRows.length === 0 ? (
                <div className="py-8 text-center">
                  <PackageCheck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Busque uma ordem para ver a grade cortada.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-2 py-1.5 text-left font-semibold w-8">ID</th>
                        <th className="px-2 py-1.5 text-left font-semibold w-20">COR</th>
                        {TAMANHOS.map((t) => (
                          <th key={t} className="px-1 py-1.5 text-center font-semibold w-12">{t}</th>
                        ))}
                        <th className="px-2 py-1.5 text-center font-semibold w-20">TOTAL PEÇAS</th>
                        <th className="px-2 py-1.5 text-center font-semibold w-24">TOTAL DEFEITOS</th>
                        <th className="px-2 py-1.5 text-center font-semibold w-24">RECEBIDO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeRows.map((row) => (
                        <tr key={row.id} className="border-b">
                          <td className="px-2 py-1 text-center text-muted-foreground">{row.id}</td>
                          <td className="px-2 py-1 font-medium">{row.cor}</td>
                          {TAMANHOS.map((t) => (
                            <td key={t} className="px-1 py-1 text-center">
                              <div className="bg-muted rounded px-1 py-0.5 text-center font-mono">
                                {row.qtdCortada[t] || 0}
                              </div>
                            </td>
                          ))}
                          <td className="px-2 py-1 text-center font-bold bg-muted rounded">{row.totalPecas}</td>
                          <td className="px-1 py-1">
                            <Input
                              type="number" min="0"
                              value={row.totalDefeitos}
                              onChange={(e) => updateGradeField(row.id, "totalDefeitos", e.target.value)}
                              className={`h-7 text-xs text-center px-1 ${yellowInput}`}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              type="number" min="0"
                              value={row.totalRecebido}
                              onChange={(e) => updateGradeField(row.id, "totalRecebido", e.target.value)}
                              className={`h-7 text-xs text-center px-1 ${yellowInput}`}
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <div className="bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">OBSERVAÇÕES</h3>
            </div>
            <CardContent className="p-4">
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className={`${yellowInput} min-h-[80px]`}
                placeholder="Anotações sobre o recebimento..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecebimentoPage;
