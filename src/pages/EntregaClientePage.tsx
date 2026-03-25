import { useState, useCallback, useMemo } from "react";
import { format, parse, differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useOrdensCorte, useEntregaCliente, useModelos } from "@/hooks/useSupabaseData";
import { Search, Printer, PackageCheck, ImageOff, Send, CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const TAMANHOS = ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"];

interface GradeCortadaRow {
  id: string;
  cor: string;
  qtdCortada: Record<string, number>;
  totalPecasRecebido: number;
  totalDefeitos: number;
}

interface GradeEntregueRow {
  id: string;
  cor: string;
  qtdEntregue: Record<string, string>;
  segundaQualidade: string;
}

const EntregaClientePage = () => {
  const { ordens: ordensCorteDb } = useOrdensCorte();
  const { salvarEntrega } = useEntregaCliente();
  const { modelos: modelosDb } = useModelos();
  const [currentOrdemCorteId, setCurrentOrdemCorteId] = useState<string | null>(null);
  // Consulta (read-only)
  const [ordemCorte, setOrdemCorte] = useState("");
  const [referencia, setReferencia] = useState("");
  const [modeloNome, setModeloNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [dataCorte, setDataCorte] = useState("");
  const [oficina, setOficina] = useState("");
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>(undefined);
  const [dataEnvio, setDataEnvio] = useState("");
  const [tempoProducao, setTempoProducao] = useState("");

  // Editáveis (amarelo)
  const [observacoes, setObservacoes] = useState("");
  const [statusKanban, setStatusKanban] = useState("");

  // Imagem ref
  const [refImage, setRefImage] = useState<string | null>(null);

  // Grades
  const [gradeCortada, setGradeCortada] = useState<GradeCortadaRow[]>([]);
  const [gradeEntregue, setGradeEntregue] = useState<GradeEntregueRow[]>([]);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const filteredOrdens = ordensCorteDb.filter(
    (oc: any) =>
    (oc.numero || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (oc.modelo_ref || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusLabel = (s: string) => {
    switch (s) {
      case "pendente":return "Pendente";
      case "em_andamento":return "Em Andamento";
      case "concluido":return "Concluído";
      case "cancelado":return "Cancelado";
      default:return s;
    }
  };

  const loadOrdem = (oc: any) => {
    setCurrentOrdemCorteId(oc.id);
    setOrdemCorte(oc.numero);
    setReferencia(oc.modelo_ref || "");
    const foundModelo = modelosDb.find((m: any) => m.referencia === oc.modelo_ref);
    setModeloNome(foundModelo?.descricao || "");
    setCliente("");
    setDataCorte(oc.data_corte || "");
    setOficina("");
    setDataEnvio("");
    setDataEntrega(undefined);
    setTempoProducao("");

    // Grade cortada from ordem
    if (oc.grade_corte && oc.grade_corte.length > 0) {
      const cortada = oc.grade_corte.map((g: any) => ({
        id: g.id || crypto.randomUUID(),
        cor: g.cor || "",
        qtdCortada: {
          PP: g.pp || 0, P: g.p || 0, M: g.m || 0, G: g.g || 0,
          GG: g.gg || 0, G1: g.g1 || 0, G2: g.g2 || 0, G3: g.g3 || 0,
        },
        totalPecasRecebido: (g.pp || 0) + (g.p || 0) + (g.m || 0) + (g.g || 0) + (g.gg || 0) + (g.g1 || 0) + (g.g2 || 0) + (g.g3 || 0),
        totalDefeitos: 0,
      }));
      setGradeCortada(cortada);

      const entregue = oc.grade_corte.map((g: any) => ({
        id: g.id || crypto.randomUUID(),
        cor: g.cor || "",
        qtdEntregue: Object.fromEntries(TAMANHOS.map((t: string) => [t, ""])),
        segundaQualidade: "",
      }));
      setGradeEntregue(entregue);
    } else {
      setGradeCortada([]);
      setGradeEntregue([]);
    }

    setRefImage(null);
    setSearchOpen(false);
    setIsLoaded(true);
    setObservacoes("");
    setStatusKanban("");
  };

  const updateEntregue = (rowId: string, tam: string, val: string) =>
  setGradeEntregue((prev) =>
  prev.map((r) => r.id === rowId ? { ...r, qtdEntregue: { ...r.qtdEntregue, [tam]: val } } : r)
  );

  const updateEntregueField = (rowId: string, field: "segundaQualidade", val: string) =>
  setGradeEntregue((prev) => prev.map((r) => r.id === rowId ? { ...r, [field]: val } : r));

  const totalEntregueBySize = (tam: string) => gradeEntregue.reduce((s, r) => s + (parseInt(r.qtdEntregue[tam]) || 0), 0);
  const totalEntregueGeral = TAMANHOS.reduce((s, t) => s + totalEntregueBySize(t), 0);

  // Auto-calculated from grade
  const qtdEntregueAuto = useMemo(() => {
    return gradeEntregue.reduce((sum, row) => {
      const rowTotal = TAMANHOS.reduce((s, t) => s + (parseInt(row.qtdEntregue[t]) || 0), 0);
      return sum + rowTotal;
    }, 0);
  }, [gradeEntregue]);

  const segundaQualidadeAuto = useMemo(() => {
    return gradeEntregue.reduce((sum, row) => sum + (parseInt(row.segundaQualidade) || 0), 0);
  }, [gradeEntregue]);

  const handleRegistrarEntrega = () => {
    if (!ordemCorte) {
      toast({ title: "Nenhuma ordem carregada", description: "Busque uma ordem primeiro.", variant: "destructive" });
      return;
    }
    toast({ title: "Entrega registrada", description: `Entrega da ordem ${ordemCorte} registrada com sucesso.` });
  };

  const handlePrint = useCallback(() => {window.print();}, []);

  const yellowInput =
  "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";
  const readOnlyInput =
  "bg-muted text-foreground border-border cursor-default";

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">ENTREGA CLIENTE</h1>
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
                  {filteredOrdens.map((oc) =>
                  <button key={oc.id} onClick={() => loadOrdem(oc)} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                      <div className="font-mono text-xs font-semibold text-primary">{oc.numero}</div>
                      <div className="text-muted-foreground text-xs">{oc.modeloRef} — {oc.tecido}</div>
                      <div className="text-muted-foreground text-[10px]">{statusLabel(oc.status)} • {oc.quantidadePecas} peças</div>
                    </button>
                  )}
                  {filteredOrdens.length === 0 &&
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ordem encontrada</p>
                  }
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Separator className="hidden md:block" />

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)]"
            onClick={handleRegistrarEntrega}>
            
            <Send className="w-4 h-4" />
            <span>Registrar Entrega</span>
          </Button>

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
                  <Input value={modeloNome} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Data do Corte</Label>
                  <Input value={dataCorte} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Data de Entrega</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 text-xs bg-[hsl(50,100%,85%)] border-[hsl(45,100%,60%)] hover:bg-[hsl(50,100%,80%)]",
                          !dataEntrega && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {dataEntrega ? format(dataEntrega, "dd/MM/yyyy") : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataEntrega}
                        onSelect={(date) => {
                          setDataEntrega(date);
                          if (date && dataEnvio) {
                            const envio = parse(dataEnvio, "yyyy-MM-dd", new Date());
                            const dias = differenceInDays(date, envio);
                            setTempoProducao(`${dias} dias`);
                          }
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tempo de Produção</Label>
                  <Input value={tempoProducao} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Oficina</Label>
                  <Input value={oficina} readOnly className={readOnlyInput} placeholder="—" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados da Entrega + Imagem */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-4">
            <Card>
              <div className="bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
                <h3 className="text-sm font-bold tracking-wide text-center">ENTREGA</h3>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Qtd Entregue</Label>
                    <Input value={qtdEntregueAuto > 0 ? String(qtdEntregueAuto) : ""} readOnly className={readOnlyInput} placeholder="Auto" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">2ª Qualidade</Label>
                    <Input value={segundaQualidadeAuto > 0 ? String(segundaQualidadeAuto) : ""} readOnly className={readOnlyInput} placeholder="Auto" />
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
                {refImage ?
                <div className="w-full h-full min-h-[200px]">
                    <img src={refImage} alt="Referência do modelo" className="w-full h-full object-contain rounded" />
                  </div> :

                <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                    <ImageOff className="w-10 h-10" />
                    <span className="text-xs">Imagem será carregada ao buscar uma ordem</span>
                  </div>
                }
              </CardContent>
            </Card>
          </div>

          {/* Grade Cortada (consulta) */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">GRADE CORTADA</h3>
            </div>
            <CardContent className="p-3">
              {gradeCortada.length === 0 ?
              <div className="py-8 text-center">
                  <PackageCheck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Busque uma ordem para ver a grade cortada.</p>
                </div> :

              <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-2 py-1.5 text-left font-semibold w-8">ID</th>
                        <th className="px-2 py-1.5 text-left font-semibold w-20">COR</th>
                        {TAMANHOS.map((t) =>
                      <th key={t} className="px-1 py-1.5 text-center font-semibold w-12">{t}</th>
                      )}
                        <th className="px-2 py-1.5 text-center font-semibold w-24">TOTAL RECEBIDO</th>
                        <th className="px-2 py-1.5 text-center font-semibold w-24">TOTAL DEFEITOS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeCortada.map((row) =>
                    <tr key={row.id} className="border-b">
                          <td className="px-2 py-1 text-center text-muted-foreground">{row.id}</td>
                          <td className="px-2 py-1 font-medium">{row.cor}</td>
                          {TAMANHOS.map((t) =>
                      <td key={t} className="px-1 py-1 text-center">
                              <div className="bg-muted rounded px-1 py-0.5 text-center font-mono">
                                {row.qtdCortada[t] || 0}
                              </div>
                            </td>
                      )}
                          <td className="px-2 py-1 text-center font-bold bg-muted rounded">{row.totalPecasRecebido}</td>
                          <td className="px-2 py-1 text-center bg-muted rounded">{row.totalDefeitos}</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              }
            </CardContent>
          </Card>

          {/* Grade Entregue (editável) */}
          <Card>
            <div className="bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">GRADE ENTREGUE</h3>
            </div>
            <CardContent className="p-3">
              {gradeEntregue.length === 0 ?
              <div className="py-8 text-center">
                  <PackageCheck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Busque uma ordem para preencher a grade de entrega.</p>
                </div> :

              <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-2 py-1.5 text-left font-semibold w-20">COR</th>
                        {TAMANHOS.map((t) =>
                      <th key={t} className="px-1 py-1.5 text-center font-semibold w-12">{t}</th>
                      )}
                        <th className="px-2 py-1.5 text-center font-semibold w-24">TOTAL ENTREGUE</th>
                        <th className="px-2 py-1.5 text-center font-semibold w-24">2ª QUALIDADE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeEntregue.map((row) => {
                      const totalRow = TAMANHOS.reduce((s, t) => s + (parseInt(row.qtdEntregue[t]) || 0), 0);
                      return (
                        <tr key={row.id} className="border-b">
                            <td className="px-2 py-1 font-medium">{row.cor}</td>
                            {TAMANHOS.map((t) =>
                          <td key={t} className="px-0.5 py-1">
                                <Input
                              type="number" min="0"
                              value={row.qtdEntregue[t]}
                              onChange={(e) => updateEntregue(row.id, t, e.target.value)}
                              className={`h-7 text-xs text-center px-1 ${yellowInput}`} />
                            
                              </td>
                          )}
                            <td className="px-2 py-1 text-center font-bold text-[hsl(38,92%,40%)]">{totalRow}</td>
                            <td className="px-1 py-1">
                              <Input
                              type="number" min="0"
                              value={row.segundaQualidade}
                              onChange={(e) => updateEntregueField(row.id, "segundaQualidade", e.target.value)}
                              className={`h-7 text-xs text-center px-1 ${yellowInput}`}
                              placeholder="0" />
                            
                            </td>
                          </tr>);

                    })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td className="px-2 py-1.5">TOTAL</td>
                        {TAMANHOS.map((t) =>
                      <td key={t} className="px-1 py-1.5 text-center text-[hsl(38,92%,40%)]">{totalEntregueBySize(t)}</td>
                      )}
                        <td className="px-2 py-1.5 text-center text-[hsl(38,92%,40%)]">{totalEntregueGeral}</td>
                        <td className="px-2 py-1.5 text-center">{segundaQualidadeAuto}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              }
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
                placeholder="Anotações sobre a entrega..." />
              
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);

};

export default EntregaClientePage;