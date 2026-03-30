import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from
"@/components/ui/alert-dialog";
import { useModelos, useClientes, useAviamentos } from "@/hooks/useSupabaseData";

// Modelos from Cadastro module
const cadastroModelosList = [
  { id: "1", nome: "Calça" }, { id: "2", nome: "Shorts" }, { id: "3", nome: "Top" },
  { id: "4", nome: "Saia" }, { id: "5", nome: "Vestido" }, { id: "6", nome: "Macacão" },
  { id: "7", nome: "Macaquinho" }, { id: "8", nome: "Blazer" }, { id: "9", nome: "Colete" },
  { id: "10", nome: "Shorts-Saia" }, { id: "11", nome: "Camisa" }, { id: "12", nome: "Cropped" },
];
import { Plus, Save, Trash2, Printer, Search, Shirt, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ── Types ──
interface AviamentoRow {
  tipo: string;
  selectedItem: any | null;
  partesQtde: string;
}

interface ServicoRow {
  descricao: string;
  custoPorPeca: string;
}

interface GradacaoRow {
  descricao: string;
  aumentoCm: string;
  pp: string;
  p: string;
  m: string;
  g: string;
  gg: string;
  g1: string;
  g2: string;
  g3: string;
}

const defaultAviamentos: AviamentoRow[] = [
{ tipo: "Elásticos", selectedItem: null, partesQtde: "" },
{ tipo: "Zíper", selectedItem: null, partesQtde: "" },
{ tipo: "Regulador", selectedItem: null, partesQtde: "" },
{ tipo: "Botão", selectedItem: null, partesQtde: "" },
{ tipo: "Outros Aviamentos", selectedItem: null, partesQtde: "" }];


const defaultServicos: ServicoRow[] = [
{ descricao: "Serviço de Entretela (Partes)", custoPorPeca: "" },
{ descricao: "Serviço de Oficina", custoPorPeca: "" },
{ descricao: "Acabamento Interno", custoPorPeca: "" }];


const emptyGradacao = (): GradacaoRow => ({
  descricao: "", aumentoCm: "", pp: "", p: "", m: "", g: "", gg: "", g1: "", g2: "", g3: ""
});

const calcGradacao = (p: string, aumento: string): Partial<GradacaoRow> => {
  const pVal = parseFloat(p);
  const inc = parseFloat(aumento);
  if (isNaN(pVal) || isNaN(inc)) return {};
  const mVal = pVal + inc;
  const gVal = mVal + inc;
  const ggVal = gVal + inc;
  const g1Val = ggVal + inc;
  const g2Val = g1Val + inc;
  const g3Val = g2Val + inc;
  const ppVal = pVal - inc;
  return {
    pp: ppVal.toFixed(2),
    m: mVal.toFixed(2),
    g: gVal.toFixed(2),
    gg: ggVal.toFixed(2),
    g1: g1Val.toFixed(2),
    g2: g2Val.toFixed(2),
    g3: g3Val.toFixed(2)
  };
};

const ACCEPTED_FILE_FORMATS = ".dxf,.ads,.dwg,.plt,.hpgl,.svg,.pdf,.ai,.zip,.cdr";

const ModelosPage = () => {
  const { modelos, salvarModelo } = useModelos();
  const { clientes } = useClientes();
  const { aviamentos: dbAviamentos } = useAviamentos();
  const [referencia, setReferencia] = useState("");
  const [modelo, setModelo] = useState("");
  const [cliente, setCliente] = useState("");
  const [statusKanban, setStatusKanban] = useState("");
  const [pilotoEntregue, setPilotoEntregue] = useState("");
  const [dataPedido, setDataPedido] = useState("");
  const [entretela, setEntretela] = useState(false);
  const [entretelaDescricao, setEntreTelaDescricao] = useState("");
  const [entreTelaQtde, setEntreTelaQtde] = useState("");
  const [forroTecido2, setForroTecido2] = useState(false);
  const [forroDescricao, setForroDescricao] = useState("");
  const [forroQtde, setForroQtde] = useState("");

  const [aviamentos, setAviamentos] = useState<AviamentoRow[]>(defaultAviamentos.map((a) => ({ ...a })));
  const [servicos, setServicos] = useState<ServicoRow[]>(defaultServicos.map((s) => ({ ...s })));
  const [consumoMetros, setConsumoMetros] = useState("");
  const [consumoGramas, setConsumoGramas] = useState("");
  const [gradacao, setGradacao] = useState<GradacaoRow[]>(Array.from({ length: 6 }, emptyGradacao));

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [aviamentoSearchOpen, setAviamentoSearchOpen] = useState<number | null>(null);
  const [aviamentoSearchTerm, setAviamentoSearchTerm] = useState("");
  const [modeloCadastroSearchOpen, setModeloCadastroSearchOpen] = useState(false);
  const [modeloCadastroSearchTerm, setModeloCadastroSearchTerm] = useState("");
  const [clienteSearchOpen, setClienteSearchOpen] = useState(false);
  const [clienteSearchTerm, setClienteSearchTerm] = useState("");

  // File upload
  const [modelagemFile, setModelagemFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [modelImage, setModelImage] = useState<string | null>(null);

  // Dialogs
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveOverwriteDialogOpen, setSaveOverwriteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoadedFromSearch, setIsLoadedFromSearch] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const filteredModelos = modelos.filter(
    (m: any) =>
    (m.referencia || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.descricao || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadModelo = (m: any) => {
    setReferencia(m.referencia || "");
    setModelo(m.descricao || "");
    setCliente("");
    setPilotoEntregue("");
    setDataPedido("");
    setConsumoMetros(m.consumo_tecido ? Number(m.consumo_tecido).toFixed(2) : "");
    setConsumoGramas("");
    setEntretela(false);
    setForroTecido2(false);
    setEntreTelaDescricao("");setEntreTelaQtde("");
    setForroDescricao("");setForroQtde("");
    setAviamentos(defaultAviamentos.map((a) => ({ ...a })));
    setServicos(defaultServicos.map((s) => ({ ...s })));
    setGradacao(Array.from({ length: 6 }, emptyGradacao));
    setModelagemFile(null);
    setSearchOpen(false);
    setIsLoadedFromSearch(true);
  };

  const limparCampos = () => {
    setReferencia("");setModelo("");setCliente("");setStatusKanban("");
    setPilotoEntregue("");setDataPedido("");
    setEntretela(false);setEntreTelaDescricao("");setEntreTelaQtde("");
    setForroTecido2(false);setForroDescricao("");setForroQtde("");
    setAviamentos(defaultAviamentos.map((a) => ({ ...a })));
    setServicos(defaultServicos.map((s) => ({ ...s })));
    setConsumoMetros("");setConsumoGramas("");
    setGradacao(Array.from({ length: 6 }, emptyGradacao));
    setModelagemFile(null);
    setModelImage(null);
    setIsLoadedFromSearch(false);
  };

  const allFieldsFilled = () => {
    return referencia && modelo && cliente && pilotoEntregue && dataPedido;
  };

  // ── File upload handler ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setModelagemFile(file);
      toast({ title: "Arquivo selecionado", description: `${file.name} carregado com sucesso.` });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelImage(url);
      toast({ title: "Imagem carregada", description: `${file.name} carregada com sucesso.` });
    }
  };

  // ── Aviamentos handlers ──
  const selectAviamentoItem = (idx: number, item: any) => {
    setAviamentos((prev) => prev.map((a, i) => i === idx ? { ...a, selectedItem: item } : a));
    setAviamentoSearchOpen(null);
    setAviamentoSearchTerm("");
  };

  const updateAviamentoQtde = (idx: number, value: string) => {
    setAviamentos((prev) => prev.map((a, i) => i === idx ? { ...a, partesQtde: value } : a));
  };

  // ── Serviços handlers ──
  const updateServicoCusto = (idx: number, value: string) => {
    setServicos((prev) => prev.map((s, i) => i === idx ? { ...s, custoPorPeca: value } : s));
  };

  const custoTotalServicos = servicos.reduce((sum, s) => sum + (parseFloat(s.custoPorPeca) || 0), 0);

  // ── Gradação handlers ──
  const updateGradacao = (idx: number, field: keyof GradacaoRow, value: string) => {
    setGradacao((prev) => prev.map((g, i) => {
      if (i !== idx) return g;
      const updated = { ...g, [field]: value };
      if (field === "p" || field === "aumentoCm") {
        const calc = calcGradacao(
          field === "p" ? value : updated.p,
          field === "aumentoCm" ? value : updated.aumentoCm
        );
        return { ...updated, ...calc };
      }
      return updated;
    }));
  };

  // ── Save / Clone ──
  const handleSaveClick = async () => {
    if (isLoadedFromSearch) {
      // First ask: save or clone?
      setSaveDialogOpen(true);
    } else {
      if (!allFieldsFilled()) {
        toast({ title: "Campos obrigatórios", description: "Preencha todos os campos editáveis antes de salvar.", variant: "destructive" });
        return;
      }
      const result = await salvarModelo({
        referencia,
        descricao: modelo,
        consumo_tecido: parseFloat(consumoMetros) || 0,
        status: statusKanban === "concluido" ? "ativo" : statusKanban === "pendente" ? "desenvolvimento" : "ativo",
      });
      if (result) {
        toast({ title: "Modelo salvo", description: `Referência ${referencia} salva com sucesso.` });
      }
    }
  };

  const handleSaveOverwriteStep1 = () => {
    // Close first dialog, open overwrite confirmation
    setSaveDialogOpen(false);
    setSaveOverwriteDialogOpen(true);
  };

  const handleSaveOverwriteConfirm = async () => {
    setSaveOverwriteDialogOpen(false);
    const existingModel = modelos.find((m: any) => m.referencia === referencia);
    const result = await salvarModelo({
      referencia,
      descricao: modelo,
      consumo_tecido: parseFloat(consumoMetros) || 0,
      status: statusKanban === "concluido" ? "ativo" : statusKanban === "pendente" ? "desenvolvimento" : "ativo",
    }, existingModel?.id);
    if (result) {
      toast({ title: "Modelo atualizado", description: `Referência ${referencia} foi sobrescrita com sucesso.` });
    }
  };

  const handleClone = () => {
    setSaveDialogOpen(false);
    setReferencia("");
    setIsLoadedFromSearch(false);
    toast({ title: "Duplicar modelo", description: "A referência foi zerada. Preencha o número da nova referência e salve." });
  };

  // ── Clear ──
  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    limparCampos();
    toast({ title: "Registro limpo", description: "Todos os dados do produto foram apagados da tela." });
  };

  // ── Include ──
  const handleIncluir = () => {
    limparCampos();
    toast({ title: "Novo modelo", description: "Campos abertos para inclusão de nova referência. Preencha todos os campos." });
  };

  // ── Print ──
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const yellowInput = "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";

  const fichaContent =
  <div className="flex-1 space-y-4">
      {/* Header fields */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Referência</Label>
              <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} className={yellowInput} placeholder="MK-2024-001" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Modelo</Label>
              <div className="flex gap-1">
                <Input value={modelo} onChange={(e) => setModelo(e.target.value)} className={`flex-1 ${yellowInput}`} placeholder="Nome do modelo" />
                <Sheet open={modeloCadastroSearchOpen} onOpenChange={(open) => {setModeloCadastroSearchOpen(open);setModeloCadastroSearchTerm("");}}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"><Search className="w-4 h-4" /></Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <SheetHeader><SheetTitle>Buscar Modelo (Cadastro)</SheetTitle></SheetHeader>
                    <div className="mt-4 space-y-3">
                      <Input placeholder="Nome do modelo..." value={modeloCadastroSearchTerm} onChange={(e) => setModeloCadastroSearchTerm(e.target.value)} />
                      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                        {cadastroModelosList.filter(m => m.nome.toLowerCase().includes(modeloCadastroSearchTerm.toLowerCase())).map((m) =>
                        <button key={m.id} onClick={() => {setModelo(m.nome);setModeloCadastroSearchOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                            <div className="font-medium text-sm">{m.nome}</div>
                          </button>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cliente</Label>
              <div className="flex gap-1">
                <Input value={cliente} onChange={(e) => setCliente(e.target.value)} className={`flex-1 ${yellowInput}`} placeholder="Cliente" />
                <Sheet open={clienteSearchOpen} onOpenChange={(open) => {setClienteSearchOpen(open);setClienteSearchTerm("");}}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"><Search className="w-4 h-4" /></Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <SheetHeader><SheetTitle>Buscar Cliente</SheetTitle></SheetHeader>
                    <div className="mt-4 space-y-3">
                      <Input placeholder="Razão Social ou CNPJ..." value={clienteSearchTerm} onChange={(e) => setClienteSearchTerm(e.target.value)} />
                      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                        {clientes.filter((c: any) => (c.razao_social || "").toLowerCase().includes(clienteSearchTerm.toLowerCase()) || (c.cnpj || "").includes(clienteSearchTerm)).map((c: any) =>
                        <button key={c.id} onClick={() => {setCliente(c.razao_social);setClienteSearchOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                            <div className="font-mono text-xs font-semibold text-primary">{c.razao_social}</div>
                            <div className="text-muted-foreground text-xs">{c.cnpj} — {c.cidade}/{c.uf}</div>
                          </button>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Piloto Entregue?</Label>
              <select
                value={pilotoEntregue}
                onChange={(e) => setPilotoEntregue(e.target.value)}
                className={`flex h-10 w-full items-center rounded-md border px-3 py-2 text-sm ${yellowInput}`}
              >
                <option value="">Selecionar</option>
                <option value="sim">SIM</option>
                <option value="nao">NÃO</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Data do Pedido</Label>
              <Input type="date" value={dataPedido} onChange={(e) => setDataPedido(e.target.value)} className={yellowInput} />
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

      {/* Middle section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image */}
        <div className="space-y-4">
          <Card className="flex items-center justify-center min-h-[280px] overflow-hidden">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {modelImage ? (
              <div className="relative w-full h-full min-h-[280px]">
                <img src={modelImage} alt="Modelo" className="w-full h-full object-contain p-2" />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-2 right-2 text-xs print:hidden"
                  onClick={() => imageInputRef.current?.click()}
                >
                  Trocar Imagem
                </Button>
              </div>
            ) : (
              <div className="text-center text-muted-foreground space-y-2">
                <Shirt className="w-16 h-16 mx-auto opacity-30" />
                <p className="text-sm">Imagem do Modelo</p>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => imageInputRef.current?.click()}>Upload Imagem</Button>
              </div>
            )}
          </Card>
          {/* Arquivo Modelagem Aprovada */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-bold whitespace-nowrap">ARQUIVO MODELAGEM APROVADA</h3>
                <div className="flex items-center gap-3 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FILE_FORMATS}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Arquivo
                  </Button>
                  {modelagemFile && (
                    <span className="text-xs text-foreground font-medium truncate max-w-[300px]">
                      {modelagemFile.name}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aviamentos + Serviços */}
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
                    <th className="text-left py-2 px-3 font-semibold">TIPO</th>
                    <th className="text-left py-2 px-3 font-semibold">ITEM SELECIONADO</th>
                    <th className="text-center py-2 px-3 font-semibold w-20">BUSCAR</th>
                    <th className="text-center py-2 px-3 font-semibold w-24">PARTES/QTDE</th>
                  </tr>
                </thead>
                <tbody>
                  {aviamentos.map((av, idx) => {
                  const filteredItems = dbAviamentos.filter((it: any) =>
                  it.tipo === av.tipo &&
                  ((it.descricao || "").toLowerCase().includes(aviamentoSearchTerm.toLowerCase()) ||
                  (it.tamanho || "").toLowerCase().includes(aviamentoSearchTerm.toLowerCase()))
                  );

                  return (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-1.5 px-3 font-medium text-xs">{av.tipo}</td>
                      <td className="py-1.5 px-3 text-xs">
                        {av.selectedItem ? (
                          <span className="truncate block max-w-[180px]">
                            {av.selectedItem.descricao} - {av.selectedItem.tamanho}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Nenhum</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <Sheet open={aviamentoSearchOpen === idx} onOpenChange={(open) => { setAviamentoSearchOpen(open ? idx : null); setAviamentoSearchTerm(""); }}>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                              <Search className="w-3 h-3" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="right" className="w-80">
                            <SheetHeader>
                              <SheetTitle>Buscar {av.tipo}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 space-y-3">
                              <Input
                                placeholder="Buscar por descrição ou tamanho..."
                                value={aviamentoSearchTerm}
                                onChange={(e) => setAviamentoSearchTerm(e.target.value)}
                                className="text-sm"
                              />
                              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                                {filteredItems.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => selectAviamentoItem(idx, item)}
                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm"
                                  >
                                    <div className="font-medium text-xs">{item.descricao}</div>
                                    <div className="text-muted-foreground text-xs">{item.tamanho} — R$ {Number(item.preco_un || 0).toFixed(2)}</div>
                                  </button>
                                ))}
                                {filteredItems.length === 0 && (
                                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum item encontrado</p>
                                )}
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </td>
                      <td className="py-1.5 px-3">
                        <Input
                          value={av.partesQtde}
                          onChange={(e) => updateAviamentoQtde(idx, e.target.value)}
                          className={`h-7 text-xs text-center ${yellowInput}`}
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  );
                })}
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
                  {servicos.map((sv, idx) =>
                <tr key={idx} className="border-b last:border-0">
                      <td className="py-1.5 px-3 font-medium">{sv.descricao}</td>
                      <td className="py-1.5 px-3">
                        <Input
                      value={sv.custoPorPeca}
                      onChange={(e) => updateServicoCusto(idx, e.target.value)}
                      className={`h-7 text-xs text-center ${yellowInput}`}
                      placeholder="0.00" />

                      </td>
                    </tr>
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
          <div className="flex items-center gap-6">
            <h3 className="text-sm font-bold whitespace-nowrap">TECIDO DA PILOTO</h3>
            <div className="flex gap-4 flex-1">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Consumo (Metros)</Label>
                <Input value={consumoMetros} onChange={(e) => setConsumoMetros(e.target.value)} className={yellowInput} placeholder="0.00" />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Consumo (Gramas)</Label>
                <Input value={consumoGramas} onChange={(e) => setConsumoGramas(e.target.value)} className={yellowInput} placeholder="0.00" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entretela / Forro */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 min-w-[160px]">
              <Checkbox id="entretela" checked={entretela} onCheckedChange={(v) => setEntretela(!!v)} />
              <Label htmlFor="entretela" className="text-sm font-medium">Entretela</Label>
            </div>
            {entretela &&
          <>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Descrição</Label>
                  <Input value={entretelaDescricao} onChange={(e) => setEntreTelaDescricao(e.target.value)} className={yellowInput} placeholder="Descrição da entretela" />
                </div>
                <div className="space-y-1 w-28">
                  <Label className="text-xs">Quantidade</Label>
                  <Input value={entreTelaQtde} onChange={(e) => setEntreTelaQtde(e.target.value)} className={yellowInput} placeholder="0" />
                </div>
              </>
          }
          </div>
          <Separator />
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 min-w-[160px]">
              <Checkbox id="forro" checked={forroTecido2} onCheckedChange={(v) => setForroTecido2(!!v)} />
              <Label htmlFor="forro" className="text-sm font-medium">Forro / Tecido 2</Label>
            </div>
            {forroTecido2 &&
          <>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Descrição</Label>
                  <Input value={forroDescricao} onChange={(e) => setForroDescricao(e.target.value)} className={yellowInput} placeholder="Descrição do forro/tecido 2" />
                </div>
                <div className="space-y-1 w-28">
                  <Label className="text-xs">Quantidade</Label>
                  <Input value={forroQtde} onChange={(e) => setForroQtde(e.target.value)} className={yellowInput} placeholder="0" />
                </div>
              </>
          }
          </div>
        </CardContent>
      </Card>

      {/* Gradação */}
      <Card>
        <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
          <h3 className="text-sm font-bold tracking-wide text-center">GRADAÇÃO DE AVIAMENTOS</h3>
        </div>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-2 px-2 font-semibold">DESCRIÇÃO</th>
                <th className="text-center py-2 px-2 font-semibold w-20">AUMENTO (cm)</th>
                <th className="text-center py-2 px-1 font-semibold w-14">PP</th>
                <th className="text-center py-2 px-1 font-semibold w-14">P</th>
                <th className="text-center py-2 px-1 font-semibold w-14">M</th>
                <th className="text-center py-2 px-1 font-semibold w-14">G</th>
                <th className="text-center py-2 px-1 font-semibold w-14">GG</th>
                <th className="text-center py-2 px-1 font-semibold w-14">G1</th>
                <th className="text-center py-2 px-1 font-semibold w-14">G2</th>
                <th className="text-center py-2 px-1 font-semibold w-14">G3</th>
              </tr>
            </thead>
            <tbody>
              {gradacao.map((row, idx) =>
            <tr key={idx} className="border-b last:border-0">
                  <td className="py-1 px-2">
                    <Input value={row.descricao} onChange={(e) => updateGradacao(idx, "descricao", e.target.value)} className={`h-7 text-xs ${yellowInput}`} />
                  </td>
                  <td className="py-1 px-2">
                    <Input value={row.aumentoCm} onChange={(e) => updateGradacao(idx, "aumentoCm", e.target.value)} className={`h-7 text-xs text-center ${yellowInput}`} />
                  </td>
                  <td className="py-1 px-1">
                    <Input value={row.pp} readOnly className="h-7 text-xs text-center bg-muted/50 border-muted" tabIndex={-1} />
                  </td>
                  <td className="py-1 px-1">
                    <Input value={row.p} onChange={(e) => updateGradacao(idx, "p", e.target.value)} className={`h-7 text-xs text-center ${yellowInput}`} />
                  </td>
                  {(["m", "g", "gg", "g1", "g2", "g3"] as const).map((size) =>
              <td key={size} className="py-1 px-1">
                      <Input value={row[size]} readOnly className="h-7 text-xs text-center bg-muted/50 border-muted" tabIndex={-1} />
                    </td>
              )}
                </tr>
            )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>;


  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">FICHA DE MODELO</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Action Panel */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-3 md:w-40 shrink-0 print:hidden overflow-x-auto pb-2 md:pb-0">
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0">
                <Search className="w-4 h-4" />
                <span>Buscar Modelo</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Buscar Modelos</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Referência ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9" />

                </div>
                <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {filteredModelos.map((m) =>
                  <button
                    key={m.id}
                    onClick={() => loadModelo(m)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">

                      <div className="font-mono text-xs font-semibold text-primary">{m.referencia}</div>
                      <div className="text-muted-foreground text-xs">{m.descricao}</div>
                    </button>
                  )}
                  {filteredModelos.length === 0 &&
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum modelo encontrado</p>
                  }
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Separator />

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)]"
            onClick={handleIncluir}>

            <Plus className="w-4 h-4" />
            <span>Incluir Modelo</span>
          </Button>

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(217,71%,45%)] hover:bg-[hsl(217,71%,38%)] text-[hsl(0,0%,100%)]"
            onClick={handleSaveClick}>

            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </Button>

          <Button
            variant="destructive"
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0"
            onClick={() => setDeleteDialogOpen(true)}>

            <Trash2 className="w-4 h-4" />
            <span>Limpar Registro</span>
          </Button>

          <Separator />

          <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </Button>
        </div>

        {fichaContent}
      </div>

      {/* Save / Clone Dialog */}
      <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar ou Duplicar?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja sobrescrever o registro da referência <strong>{referencia}</strong> ou duplicar em uma nova referência?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveOverwriteStep1} className="bg-[hsl(217,71%,45%)] hover:bg-[hsl(217,71%,38%)]">
              Salvar (Sobrescrever)
            </AlertDialogAction>
            <AlertDialogAction onClick={handleClone} className="bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)]">
              Duplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Overwrite Confirmation Dialog */}
      <AlertDialog open={saveOverwriteDialogOpen} onOpenChange={setSaveOverwriteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Sobrescrita</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja salvar? Essa ação irá <strong>sobrescrever o registro anterior</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveOverwriteConfirm} className="bg-[hsl(217,71%,45%)] hover:bg-[hsl(217,71%,38%)]">
              Sim, Sobrescrever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados do produto serão deletados. <strong>Deseja continuar?</strong>
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
    </div>);

};

export default ModelosPage;