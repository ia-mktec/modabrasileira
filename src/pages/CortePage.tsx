import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from
"@/components/ui/alert-dialog";
import { ordensCorte, modelos, tecidos, cadastroAviamentos, clientes } from "@/lib/mock-data";
import { Plus, Save, Trash2, Printer, Search, ImageOff, Scissors, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEstoque } from "@/contexts/EstoqueContext";

const TAMANHOS = ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"];

interface GradeRow {
  id: string;
  cor: string;
  tecidoId: string;
  quantidades: Record<string, string>;
}

const createEmptyGradeRow = (): GradeRow => ({
  id: crypto.randomUUID(),
  cor: "",
  tecidoId: "",
  quantidades: Object.fromEntries(TAMANHOS.map((t) => [t, ""]))
});

const CortePage = () => {
  const navigate = useNavigate();
  const { tecidosEstoque, reservarEstoque, confirmarBaixa, cancelarReserva, getEstoqueDisponivel, getEstoqueReservado } = useEstoque();
  const [selectedTecidoId, setSelectedTecidoId] = useState("");
  const [numero, setNumero] = useState("");
  const [modeloRef, setModeloRef] = useState("");
  const [modeloNome, setModeloNome] = useState("");
  const [tecido, setTecido] = useState("");
  const [dataCorte, setDataCorte] = useState("");
  const [cortador, setCortador] = useState("");
  const [enfestos, setEnfestos] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [consumoPorPeca, setConsumoPorPeca] = useState("");
  const [reservaAtiva, setReservaAtiva] = useState(false);

  // Cliente
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteSearchOpen, setClienteSearchOpen] = useState(false);
  const [clienteSearchTerm, setClienteSearchTerm] = useState("");

  // Grade de tamanhos com múltiplas linhas (cor)
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([createEmptyGradeRow()]);

  // Cor search
  const [corSearchOpen, setCorSearchOpen] = useState(false);
  const [corSearchTerm, setCorSearchTerm] = useState("");
  const [corSearchRowId, setCorSearchRowId] = useState<string | null>(null);

  // Aviamentos
  const [aviamentos, setAviamentos] = useState<{id: string;descricao: string;quantidade: string;}[]>([]);
  const [aviamentoSearchOpen, setAviamentoSearchOpen] = useState(false);
  const [aviamentoSearchTerm, setAviamentoSearchTerm] = useState("");

  // Imagem da referência
  const [refImage, setRefImage] = useState<string | null>(null);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modeloSearchOpen, setModeloSearchOpen] = useState(false);
  const [modeloSearchTerm, setModeloSearchTerm] = useState("");
  const [tecidoSearchOpen, setTecidoSearchOpen] = useState(false);
  const [tecidoSearchTerm, setTecidoSearchTerm] = useState("");

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoadedFromSearch, setIsLoadedFromSearch] = useState(false);

  const filteredOrdens = ordensCorte.filter(
    (oc) =>
    oc.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    oc.modeloRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredModelos = modelos.filter(
    (m) =>
    m.referencia.toLowerCase().includes(modeloSearchTerm.toLowerCase()) ||
    m.descricao.toLowerCase().includes(modeloSearchTerm.toLowerCase())
  );

  // Filtra tecidos pelo cliente selecionado
  const clienteNomeSelecionado = clientes.find((c) => c.id === selectedClienteId)?.razaoSocial || "";
  const filteredTecidos = tecidos.filter(
    (t) =>
    t.cliente === clienteNomeSelecionado && (
    t.nome.toLowerCase().includes(tecidoSearchTerm.toLowerCase()) ||
    t.cor.toLowerCase().includes(tecidoSearchTerm.toLowerCase()))
  );

  // Cores disponíveis: tecidos do mesmo cliente e mesmo nome de tecido selecionado
  const coresDisponiveisData = tecidos.
  filter((t) => t.cliente === clienteNomeSelecionado && t.nome === tecido);

  const filteredCores = coresDisponiveisData.filter((t) =>
  t.cor.toLowerCase().includes(corSearchTerm.toLowerCase())
  );

  const filteredClientes = clientes.filter(
    (c) =>
    c.razaoSocial.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
    c.cnpj.includes(clienteSearchTerm)
  );

  const allAviamentoItems = cadastroAviamentos.flatMap((cat) =>
  cat.itens.map((item) => ({ ...item, tipo: cat.tipo }))
  );

  const filteredAviamentos = allAviamentoItems.filter(
    (a) =>
    a.descricao.toLowerCase().includes(aviamentoSearchTerm.toLowerCase()) ||
    a.tipo.toLowerCase().includes(aviamentoSearchTerm.toLowerCase())
  );

  const loadOrdem = (oc: typeof ordensCorte[0]) => {
    setNumero(oc.numero);
    setModeloRef(oc.modeloRef);
    const foundModelo = modelos.find(m => m.referencia === oc.modeloRef);
    setModeloNome(foundModelo?.descricao || "");
    setTecido(oc.tecido);
    setDataCorte(oc.dataCorte);
    setCortador(oc.cortador);
    setEnfestos(String(oc.enfestos));
    setStatus(oc.status);
    setSearchOpen(false);
    setIsLoadedFromSearch(true);
  };

  const limparCampos = () => {
    if (reservaAtiva && numero) {
      cancelarReserva(numero);
    }
    setNumero("");setModeloRef("");setModeloNome("");setTecido("");setSelectedTecidoId("");
    setDataCorte("");setCortador("");
    setEnfestos("");setStatus("");
    setObservacoes("");setConsumoPorPeca("");
    setSelectedClienteId("");setClienteNome("");
    setGradeRows([createEmptyGradeRow()]);
    setAviamentos([]);
    setRefImage(null);
    setIsLoadedFromSearch(false);
    setReservaAtiva(false);
  };

  // Total geral vem da grade de tamanhos
  const totalBySize = (tam: string) =>
  gradeRows.reduce((sum, r) => sum + (parseInt(r.quantidades[tam]) || 0), 0);
  const totalGeral = TAMANHOS.reduce((sum, t) => sum + totalBySize(t), 0);

  const consumoTotal = totalGeral * (parseFloat(consumoPorPeca) || 0);

  const handleSave = () => {
    if (!numero || !modeloRef || !tecido) {
      toast({ title: "Campos obrigatórios", description: "Preencha ao menos Nº Ordem, Modelo e Tecido.", variant: "destructive" });
      return;
    }
    if (!selectedClienteId) {
      toast({ title: "Cliente não selecionado", description: "Selecione um cliente antes de salvar.", variant: "destructive" });
      return;
    }

    const consumoPorPecaNum = parseFloat(consumoPorPeca) || 0;
    if (consumoPorPecaNum <= 0) {
      toast({ title: "Consumo inválido", description: "Preencha o consumo por peça.", variant: "destructive" });
      return;
    }

    // Validate that all grade rows with quantities have a color/tecido selected
    const rowsComQtd = gradeRows.filter((row) => {
      const rowTotal = TAMANHOS.reduce((sum, t) => sum + (parseInt(row.quantidades[t]) || 0), 0);
      return rowTotal > 0;
    });

    if (rowsComQtd.length === 0) {
      toast({ title: "Grade vazia", description: "Preencha ao menos uma linha da grade de tamanhos.", variant: "destructive" });
      return;
    }

    const rowsSemCor = rowsComQtd.filter((row) => !row.tecidoId);
    if (rowsSemCor.length > 0) {
      toast({ title: "Cor não selecionada", description: "Selecione a cor em todas as linhas com quantidades preenchidas.", variant: "destructive" });
      return;
    }

    // Reserve stock per color row
    let allOk = true;
    for (const row of rowsComQtd) {
      const rowTotal = TAMANHOS.reduce((sum, t) => sum + (parseInt(row.quantidades[t]) || 0), 0);
      const consumoRow = rowTotal * consumoPorPecaNum;
      const disponivel = getEstoqueDisponivel(row.tecidoId);

      if (consumoRow > disponivel) {
        toast({
          title: "Estoque insuficiente",
          description: `Cor "${row.cor}": Disponível ${disponivel.toFixed(2)} Kg, necessário ${consumoRow.toFixed(2)} Kg.`,
          variant: "destructive"
        });
        allOk = false;
        break;
      }

      const ok = reservarEstoque(numero, row.tecidoId, `${tecido} - ${row.cor}`, consumoRow);
      if (!ok) {
        allOk = false;
        toast({ title: "Erro na reserva", description: `Não foi possível reservar estoque para cor "${row.cor}".`, variant: "destructive" });
        break;
      }
    }

    if (allOk) {
      setReservaAtiva(true);
      toast({
        title: "Ordem salva — Estoque reservado",
        description: `${consumoTotal.toFixed(2)} Kg reservados para a ordem ${numero} (${rowsComQtd.length} cor(es)).`
      });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (newStatus === "concluido" && reservaAtiva && numero) {
      const ok = confirmarBaixa(numero, 0);
      if (ok) {
        setReservaAtiva(false);
        toast({
          title: "Baixa de estoque confirmada",
          description: `Corte concluído. Baixa de ${consumoTotal.toFixed(2)} Kg efetivada no estoque.`
        });
      }
    }
  };

  const handleIncluir = () => {
    limparCampos();
    toast({ title: "Nova ordem de corte", description: "Campos abertos para inclusão." });
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    limparCampos();
    toast({ title: "Registro limpo", description: "Dados da ordem de corte foram apagados." });
  };

  const handlePrint = useCallback(() => {window.print();}, []);

  // Grade helpers
  const addGradeRow = () => setGradeRows((prev) => [...prev, createEmptyGradeRow()]);
  const removeGradeRow = (id: string) => setGradeRows((prev) => prev.filter((r) => r.id !== id));
  const updateGradeRowCor = (id: string, cor: string, tecidoId: string) =>
  setGradeRows((prev) => prev.map((r) => r.id === id ? { ...r, cor, tecidoId } : r));
  const updateGradeRowQtd = (id: string, tam: string, val: string) =>
  setGradeRows((prev) =>
  prev.map((r) => r.id === id ? { ...r, quantidades: { ...r.quantidades, [tam]: val } } : r)
  );

  // Aviamento helpers
  const addAviamento = (descricao: string) => {
    setAviamentos((prev) => [...prev, { id: crypto.randomUUID(), descricao, quantidade: "" }]);
    setAviamentoSearchOpen(false);
  };
  const removeAviamento = (id: string) => setAviamentos((prev) => prev.filter((a) => a.id !== id));
  const updateAviamentoQtd = (id: string, quantidade: string) =>
  setAviamentos((prev) => prev.map((a) => a.id === id ? { ...a, quantidade } : a));

  const yellowInput =
  "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";

  const statusLabel = (s: string) => {
    switch (s) {
      case "pendente":return "Pendente";
      case "em_andamento":return "Em Andamento";
      case "concluido":return "Concluído";
      case "cancelado":return "Cancelado";
      default:return "";
    }
  };

  const handleTecidoSearch = () => {
    if (!selectedClienteId) {
      toast({ title: "Selecione um cliente", description: "É necessário selecionar o cliente antes de buscar o tecido.", variant: "destructive" });
      return;
    }
    setTecidoSearchOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">ORDEM DE CORTE</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Action Panel - horizontal on mobile, vertical sidebar on desktop */}
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
                <SheetTitle>Buscar Ordens de Corte</SheetTitle>
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

          <Button className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)]" onClick={handleIncluir}>
            <Plus className="w-4 h-4" />
            <span>Nova Ordem</span>
          </Button>

          <Button className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(217,71%,45%)] hover:bg-[hsl(217,71%,38%)] text-[hsl(0,0%,100%)]" onClick={handleSave}>
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </Button>

          <Button variant="destructive" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4" />
            <span>Limpar Registro</span>
          </Button>

          <Separator className="hidden md:block" />

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(38,92%,45%)] hover:bg-[hsl(38,92%,38%)] text-[hsl(0,0%,100%)]"
            onClick={() => navigate("/ficha-ziper")}>
            
            <Scissors className="w-4 h-4" />
            <span>Ficha de Zíper</span>
          </Button>

          <Separator className="hidden md:block" />

          <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </Button>
        </div>

        {/* Main Ficha Content */}
        <div className="flex-1 space-y-4">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nº Ordem</Label>
                  <Input value={numero} onChange={(e) => setNumero(e.target.value)} className={yellowInput} placeholder="OC-0000" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Cliente</Label>
                  <div className="flex gap-1">
                    <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className={`flex-1 ${yellowInput}`} placeholder="Selecione o cliente" />
                    <Sheet open={clienteSearchOpen} onOpenChange={(open) => {setClienteSearchOpen(open);setClienteSearchTerm("");}}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"><Search className="w-4 h-4" /></Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-80">
                        <SheetHeader><SheetTitle>Buscar Cliente</SheetTitle></SheetHeader>
                        <div className="mt-4 space-y-3">
                          <Input placeholder="Razão Social ou CNPJ..." value={clienteSearchTerm} onChange={(e) => setClienteSearchTerm(e.target.value)} />
                          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                            {filteredClientes.map((c) =>
                            <button key={c.id} onClick={() => {
                              setSelectedClienteId(c.id);
                              setClienteNome(c.razaoSocial);
                              setClienteSearchOpen(false);
                              // Limpa tecido ao trocar cliente
                              setTecido("");
                              setSelectedTecidoId("");
                            }} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                                <div className="font-mono text-xs font-semibold text-primary">{c.razaoSocial}</div>
                                <div className="text-muted-foreground text-xs">{c.cnpj} — {c.cidade}/{c.uf}</div>
                              </button>
                            )}
                            {filteredClientes.length === 0 &&
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente encontrado</p>
                            }
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Referência</Label>
                  <div className="flex gap-1">
                    <Input value={modeloRef} onChange={(e) => setModeloRef(e.target.value)} className={`flex-1 ${yellowInput}`} placeholder="MK-2024-001" />
                    <Sheet open={modeloSearchOpen} onOpenChange={(open) => {setModeloSearchOpen(open);setModeloSearchTerm("");}}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"><Search className="w-4 h-4" /></Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-80">
                        <SheetHeader><SheetTitle>Buscar Modelo</SheetTitle></SheetHeader>
                        <div className="mt-4 space-y-3">
                          <Input placeholder="Referência ou descrição..." value={modeloSearchTerm} onChange={(e) => setModeloSearchTerm(e.target.value)} />
                          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                            {filteredModelos.map((m) =>
                            <button key={m.id} onClick={() => {setModeloRef(m.referencia);setModeloNome(m.descricao);setModeloSearchOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                                <div className="font-mono text-xs font-semibold text-primary">{m.referencia}</div>
                                <div className="text-muted-foreground text-xs">{m.descricao}</div>
                              </button>
                            )}
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Modelo</Label>
                  <Input value={modeloNome} readOnly className="bg-muted text-foreground border-border cursor-default" placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tecido</Label>
                  <div className="flex gap-1">
                    <Input value={tecido} onChange={(e) => setTecido(e.target.value)} className={`flex-1 ${yellowInput}`} placeholder={selectedClienteId ? "Buscar tecido" : "Selecione o cliente primeiro"} readOnly={!selectedClienteId} />
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={handleTecidoSearch}>
                      <Search className="w-4 h-4" />
                    </Button>
                    <Sheet open={tecidoSearchOpen} onOpenChange={(open) => {setTecidoSearchOpen(open);setTecidoSearchTerm("");}}>
                      <SheetContent side="right" className="w-80">
                        <SheetHeader><SheetTitle>Buscar Tecido — {clienteNome}</SheetTitle></SheetHeader>
                        <div className="mt-4 space-y-3">
                          <Input placeholder="Nome ou cor..." value={tecidoSearchTerm} onChange={(e) => setTecidoSearchTerm(e.target.value)} />
                          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                            {filteredTecidos.map((t) =>
                            <button key={t.id} onClick={() => {setTecido(t.nome);setSelectedTecidoId(t.id);setTecidoSearchOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                                <div className="font-mono text-xs font-semibold text-primary">{t.nome}</div>
                                <div className="text-muted-foreground text-xs">{t.cor} — {t.cliente}</div>
                                <div className="text-muted-foreground text-[10px]">Estoque: {t.estoqueKg} Kg</div>
                              </button>
                            )}
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production details + Image side by side */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-4">
            {/* Production details */}
            <Card>
              <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
                <h3 className="text-sm font-bold tracking-wide text-center">DETALHES DA PRODUÇÃO</h3>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Data do Corte</Label>
                    <Input type="date" value={dataCorte} onChange={(e) => setDataCorte(e.target.value)} className={yellowInput} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Cortador</Label>
                    <Input value={cortador} onChange={(e) => setCortador(e.target.value)} className={yellowInput} placeholder="Nome do cortador" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Enfestador</Label>
                    <Input value={enfestos} onChange={(e) => setEnfestos(e.target.value)} className={yellowInput} placeholder="Nome do enfestador" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Consumo/Peça (Mt-Kg)</Label>
                    <Input type="number" step="0.01" value={consumoPorPeca} onChange={(e) => setConsumoPorPeca(e.target.value)} className={yellowInput} placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Consumo Total (Mt-Kg)</Label>
                    <Input value={consumoTotal > 0 ? consumoTotal.toFixed(2) : ""} readOnly className="bg-muted text-foreground border-border cursor-default" placeholder="—" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={status} onValueChange={handleStatusChange}>
                      <SelectTrigger className={yellowInput}>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedTecidoId &&
                  <div className="space-y-1 col-span-2 md:col-span-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold">Estoque disponível:</span>
                        <span className="font-mono font-bold text-primary">
                          {getEstoqueDisponivel(selectedTecidoId).toFixed(2)} Kg
                        </span>
                        {getEstoqueReservado(selectedTecidoId) > 0 &&
                      <span className="text-[hsl(38,92%,50%)] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {getEstoqueReservado(selectedTecidoId).toFixed(2)} Kg reservado
                          </span>
                      }
                        {reservaAtiva &&
                      <span className="bg-[hsl(142,71%,35%/0.15)] text-[hsl(142,71%,35%)] px-2 py-0.5 rounded-full text-[10px] font-medium">
                            ✓ Reserva ativa nesta ordem
                          </span>
                      }
                      </div>
                    </div>
                  }
                </div>
              </CardContent>
            </Card>

            {/* Reference Image - read-only (from model registration) */}
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

          {/* Grade de Tamanhos com Cor */}
          <Card>
            <div className="bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-wide text-center flex-1">GRADE DE TAMANHOS</h3>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[hsl(0,0%,100%)] hover:bg-[hsl(142,50%,40%)]" onClick={addGradeRow}>
                <Plus className="w-3 h-3 mr-1" /> Cor
              </Button>
            </div>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-border px-2 py-1.5 text-xs font-bold text-center bg-muted min-w-[100px]">COR</th>
                      {TAMANHOS.map((t) =>
                      <th key={t} className="border border-border px-2 py-1.5 text-xs font-bold text-center bg-muted min-w-[55px]">{t}</th>
                      )}
                      <th className="border border-border px-2 py-1.5 text-xs font-bold text-center bg-muted min-w-[65px]">TOTAL</th>
                      <th className="border border-border px-1 py-1.5 text-xs font-bold text-center bg-muted w-8 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeRows.map((row) => {
                      const rowTotal = TAMANHOS.reduce((sum, t) => sum + (parseInt(row.quantidades[t]) || 0), 0);
                      return (
                        <tr key={row.id}>
                          <td className="border border-border p-1">
                            <div className="flex gap-0.5">
                              <Input
                                value={row.cor}
                                readOnly
                                className={`${yellowInput} h-8 text-xs flex-1 cursor-pointer`}
                                placeholder="Selecione"
                                onClick={() => {
                                  if (!selectedTecidoId) {
                                    toast({ title: "Selecione o tecido", description: "É necessário selecionar o tecido antes de escolher a cor.", variant: "destructive" });
                                    return;
                                  }
                                  setCorSearchRowId(row.id);
                                  setCorSearchTerm("");
                                  setCorSearchOpen(true);
                                }} />
                              
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => {
                                  if (!selectedTecidoId) {
                                    toast({ title: "Selecione o tecido", description: "É necessário selecionar o tecido antes de escolher a cor.", variant: "destructive" });
                                    return;
                                  }
                                  setCorSearchRowId(row.id);
                                  setCorSearchTerm("");
                                  setCorSearchOpen(true);
                                }}>
                                
                                <Search className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                          {TAMANHOS.map((t) =>
                          <td key={t} className="border border-border p-1">
                              <Input
                              type="number"
                              value={row.quantidades[t]}
                              onChange={(e) => updateGradeRowQtd(row.id, t, e.target.value)}
                              className={`${yellowInput} h-8 text-center text-xs`}
                              placeholder="0" />
                            
                            </td>
                          )}
                          <td className="border border-border px-2 py-1 text-center font-mono font-bold text-sm bg-muted">{rowTotal}</td>
                          <td className="border border-border px-1 py-1 text-center print:hidden">
                            {gradeRows.length > 1 &&
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeGradeRow(row.id)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            }
                          </td>
                        </tr>);

                    })}
                    {/* Totalizador */}
                    <tr className="bg-muted/50 font-bold">
                      <td className="border border-border px-2 py-1.5 text-xs text-center font-bold">TOTAL</td>
                      {TAMANHOS.map((t) =>
                      <td key={t} className="border border-border px-2 py-1.5 text-center font-mono text-xs">{totalBySize(t) || ""}</td>
                      )}
                      <td className="border border-border px-2 py-1.5 text-center font-mono text-sm bg-[hsl(142,50%,90%)]">{totalGeral}</td>
                      <td className="border border-border print:hidden"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Aviamentos */}
          <Card>
            <div className="bg-[hsl(38,80%,40%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-wide text-center flex-1">AVIAMENTOS</h3>
              <Sheet open={aviamentoSearchOpen} onOpenChange={(open) => {setAviamentoSearchOpen(open);setAviamentoSearchTerm("");}}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[hsl(0,0%,100%)] hover:bg-[hsl(38,80%,50%)]">
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader><SheetTitle>Buscar Aviamento</SheetTitle></SheetHeader>
                  <div className="mt-4 space-y-3">
                    <Input placeholder="Descrição ou tipo..." value={aviamentoSearchTerm} onChange={(e) => setAviamentoSearchTerm(e.target.value)} />
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                      {filteredAviamentos.map((a) =>
                      <button
                        key={a.id}
                        onClick={() => addAviamento(a.descricao)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                        
                          <div className="font-mono text-xs font-semibold text-primary">{a.descricao}</div>
                          <div className="text-muted-foreground text-xs">{a.tipo} — {a.cor} — R$ {a.precoUn.toFixed(2)}</div>
                        </button>
                      )}
                      {filteredAviamentos.length === 0 &&
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum aviamento encontrado</p>
                      }
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <CardContent className="p-4">
              {aviamentos.length === 0 ?
              <p className="text-sm text-muted-foreground text-center py-3">Nenhum aviamento adicionado. Clique em "+ Adicionar" para buscar.</p> :

              <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-border px-3 py-1.5 text-xs font-bold text-left bg-muted">Descrição</th>
                      <th className="border border-border px-3 py-1.5 text-xs font-bold text-center bg-muted w-[120px]">Quantidade</th>
                      <th className="border border-border px-1 py-1.5 text-xs font-bold text-center bg-muted w-8 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {aviamentos.map((av) =>
                  <tr key={av.id}>
                        <td className="border border-border px-3 py-1 text-sm">{av.descricao}</td>
                        <td className="border border-border p-1">
                          <Input
                        type="number"
                        value={av.quantidade}
                        onChange={(e) => updateAviamentoQtd(av.id, e.target.value)}
                        className={`${yellowInput} h-8 text-center text-xs`}
                        placeholder="0" />
                      
                        </td>
                        <td className="border border-border px-1 py-1 text-center print:hidden">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAviamento(av.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              }
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <div className="bg-[hsl(220,14%,40%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">OBSERVAÇÕES</h3>
            </div>
            <CardContent className="p-4">
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className={`w-full rounded-md border px-3 py-2 text-sm min-h-[60px] resize-y ${yellowInput}`}
                placeholder="Anotações sobre a ordem de corte..." />
              
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados da ordem de corte serão apagados. <strong>Deseja continuar?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cor Search Sheet */}
      <Sheet open={corSearchOpen} onOpenChange={(open) => {setCorSearchOpen(open);if (!open) setCorSearchRowId(null);}}>
        <SheetContent side="right" className="w-80">
          <SheetHeader><SheetTitle>Selecionar Cor</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <Input placeholder="Buscar cor..." value={corSearchTerm} onChange={(e) => setCorSearchTerm(e.target.value)} />
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {filteredCores.map((t, idx) => {
                const disponivel = getEstoqueDisponivel(t.id);
                return (
                  <button
                    key={`${t.id}-${idx}`}
                    onClick={() => {
                      if (corSearchRowId) {
                        updateGradeRowCor(corSearchRowId, t.cor, t.id);
                      }
                      setCorSearchOpen(false);
                      setCorSearchRowId(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                    
                    <div className="font-semibold text-xs">{t.cor}</div>
                    <div className="text-muted-foreground text-[10px]">Estoque: {disponivel.toFixed(2)} Kg</div>
                  </button>);

              })}
              {filteredCores.length === 0 &&
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma cor disponível</p>
              }
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>);

};

export default CortePage;