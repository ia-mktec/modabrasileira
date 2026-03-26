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
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useTecidos, useClientes, useEstoqueMovimentacoes } from "@/hooks/useSupabaseData";

// Modelos from Cadastro module
const cadastroModelos = [
  { id: "1", nome: "Calça" }, { id: "2", nome: "Shorts" }, { id: "3", nome: "Top" },
  { id: "4", nome: "Saia" }, { id: "5", nome: "Vestido" }, { id: "6", nome: "Macacão" },
  { id: "7", nome: "Macaquinho" }, { id: "8", nome: "Blazer" }, { id: "9", nome: "Colete" },
  { id: "10", nome: "Shorts-Saia" }, { id: "11", nome: "Camisa" }, { id: "12", nome: "Cropped" },
];

// Cores from Cadastro module
const cadastroCores = [
  { cor: "Preto", cod: "001", hex: "#000000" }, { cor: "Branco", cod: "002", hex: "#ffffff" },
  { cor: "Areia", cod: "003", hex: "#c2b280" }, { cor: "Caqui", cod: "004", hex: "#c3b091" },
  { cor: "Terra", cod: "005", hex: "#8b4513" }, { cor: "Verde", cod: "006", hex: "#228b22" },
  { cor: "Marrom", cod: "007", hex: "#654321" }, { cor: "Azul", cod: "008", hex: "#0000cd" },
  { cor: "Nude", cod: "009", hex: "#f5cba7" }, { cor: "Prata", cod: "023", hex: "#c0c0c0" },
  { cor: "Camelo", cod: "010", hex: "#c19a6b" }, { cor: "Cinza", cod: "011", hex: "#808080" },
  { cor: "Mostarda", cod: "012", hex: "#ffdb58" }, { cor: "Verde Claro", cod: "013", hex: "#90ee90" },
  { cor: "Caramelo", cod: "014", hex: "#af6e4d" }, { cor: "Oliva", cod: "015", hex: "#808000" },
  { cor: "Off", cod: "016", hex: "#faf0e6" }, { cor: "Roxo", cod: "017", hex: "#800080" },
  { cor: "Rosa", cod: "018", hex: "#ff69b4" }, { cor: "Marinho", cod: "019", hex: "#001f4d" },
  { cor: "Turquesa", cod: "020", hex: "#40e0d0" }, { cor: "Chumbo", cod: "021", hex: "#36454f" },
  { cor: "Cinza Claro", cod: "022", hex: "#d3d3d3" }, { cor: "Capuccino", cod: "025", hex: "#a67b5b" },
];

import { Plus, Trash2, Printer, Search, CheckCircle, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CorRow {
  cor: string;
  cod: string;
  qtdeRolos: string;
  metragemTotal: string;
  amostraCor: string; // hex color for physical sample
}

interface RegistroTecido {
  id: string;
  cliente: string;
  ordemCorte: string;
  tecido: string;
  dataEntrada: string;
  registro: string;
  composicao: string;
  cores: CorRow[];
}

const mockRegistros: RegistroTecido[] = [
  {
    id: "1", cliente: "Têxtil Brasil", ordemCorte: "OC-0001", tecido: "Malha Cotton 30/1",
    dataEntrada: "2025-02-10", registro: "REG-001", composicao: "100% Algodão",
    cores: [
      { cor: "Branco", cod: "BRC-01", qtdeRolos: "5", metragemTotal: "250.00", amostraCor: "#ffffff" },
      { cor: "Preto", cod: "PRT-01", qtdeRolos: "3", metragemTotal: "150.00", amostraCor: "#000000" },
    ],
  },
  {
    id: "2", cliente: "Malhas SP", ordemCorte: "OC-0002", tecido: "Ribana 1x1",
    dataEntrada: "2025-02-12", registro: "REG-002", composicao: "95% Algodão 5% Elastano",
    cores: [
      { cor: "Preto", cod: "PRT-02", qtdeRolos: "4", metragemTotal: "120.00", amostraCor: "#000000" },
    ],
  },
  {
    id: "3", cliente: "Fios & Cia", ordemCorte: "OC-0003", tecido: "Viscolycra",
    dataEntrada: "2025-02-15", registro: "REG-003", composicao: "96% Viscose 4% Elastano",
    cores: [
      { cor: "Marinho", cod: "MRN-01", qtdeRolos: "6", metragemTotal: "300.00", amostraCor: "#001f4d" },
      { cor: "Vermelho", cod: "VRM-01", qtdeRolos: "2", metragemTotal: "100.00", amostraCor: "#cc0000" },
      { cor: "Cinza", cod: "CNZ-01", qtdeRolos: "4", metragemTotal: "200.00", amostraCor: "#808080" },
    ],
  },
  {
    id: "4", cliente: "PolyTech", ordemCorte: "OC-0004", tecido: "Piquet PA",
    dataEntrada: "2025-02-18", registro: "REG-004", composicao: "100% Poliamida",
    cores: [
      { cor: "Vermelho", cod: "VRM-02", qtdeRolos: "8", metragemTotal: "400.00", amostraCor: "#cc0000" },
    ],
  },
  {
    id: "5", cliente: "Denim House", ordemCorte: "OC-0005", tecido: "Jeans Denim 10oz",
    dataEntrada: "2025-02-20", registro: "REG-005", composicao: "100% Algodão",
    cores: [
      { cor: "Azul Índigo", cod: "AZI-01", qtdeRolos: "10", metragemTotal: "600.00", amostraCor: "#1a237e" },
      { cor: "Azul Claro", cod: "AZC-01", qtdeRolos: "5", metragemTotal: "300.00", amostraCor: "#64b5f6" },
    ],
  },
];

type ViewMode = "ficha" | "historico";

const TecidosPage = () => {
  const { tecidos, salvarTecido } = useTecidos();
  const { clientes } = useClientes();
  const { registrarMovimentacao } = useEstoqueMovimentacoes();
  const [viewMode, setViewMode] = useState<ViewMode>("ficha");

  // Ficha state
  const [cliente, setCliente] = useState("");
  const [ordemCorte, setOrdemCorte] = useState("");
  const [modeloTecido, setModeloTecido] = useState("");
  const [tecido, setTecido] = useState("");
  const [dataEntrada, setDataEntrada] = useState("");
  const [registro, setRegistro] = useState("");
  const [composicao, setComposicao] = useState("");
  const [qtdeCores, setQtdeCores] = useState("");
  const [cores, setCores] = useState<CorRow[]>([]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [modeloSearchOpen, setModeloSearchOpen] = useState(false);
  const [modeloSearchTerm, setModeloSearchTerm] = useState("");

  // Historico filters
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroTecido, setFiltroTecido] = useState("");
  const [filtroOrdem, setFiltroOrdem] = useState("");
  const [filtroDataDe, setFiltroDataDe] = useState("");
  const [filtroDataAte, setFiltroDataAte] = useState("");
  const [filtroCor, setFiltroCor] = useState("");

  const filteredTecidos = tecidos.filter(
    (t: any) =>
      (t.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.cor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.clientes?.razao_social || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRegistros = mockRegistros.filter((r) => {
    if (filtroCliente && !r.cliente.toLowerCase().includes(filtroCliente.toLowerCase())) return false;
    if (filtroTecido && !r.tecido.toLowerCase().includes(filtroTecido.toLowerCase())) return false;
    if (filtroOrdem && !r.ordemCorte.toLowerCase().includes(filtroOrdem.toLowerCase())) return false;
    if (filtroDataDe && r.dataEntrada < filtroDataDe) return false;
    if (filtroDataAte && r.dataEntrada > filtroDataAte) return false;
    if (filtroCor && !r.cores.some((c) => c.cor.toLowerCase().includes(filtroCor.toLowerCase()))) return false;
    return true;
  });

  const handleQtdeCoresChange = (value: string) => {
    setQtdeCores(value);
    const num = parseInt(value) || 0;
    const clamped = Math.min(Math.max(num, 0), 20);
    setCores(
      Array.from({ length: clamped }, (_, i) => cores[i] || { cor: "", cod: "", qtdeRolos: "", metragemTotal: "", amostraCor: "#ffffff" })
    );
  };

  const updateCor = (idx: number, field: keyof CorRow, value: string) => {
    setCores((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const selectCorFromCadastro = (idx: number, corNome: string) => {
    const found = cadastroCores.find(c => c.cor === corNome);
    if (found) {
      setCores((prev) => prev.map((c, i) => (i === idx ? { ...c, cor: found.cor, cod: found.cod, amostraCor: found.hex } : c)));
    }
  };

  const loadTecido = (t: any) => {
    setTecido(t.nome);
    setComposicao(t.composicao || "");
    setCliente(t.clientes?.razao_social || "");
    setSearchOpen(false);
  };

  const loadRegistro = (r: RegistroTecido) => {
    setCliente(r.cliente);
    setOrdemCorte(r.ordemCorte);
    setTecido(r.tecido);
    setDataEntrada(r.dataEntrada);
    setRegistro(r.registro);
    setComposicao(r.composicao);
    setQtdeCores(String(r.cores.length));
    setCores(r.cores.map((c) => ({ ...c })));
    setViewMode("ficha");
  };

  const limparRegistro = () => {
    setCliente(""); setOrdemCorte(""); setModeloTecido(""); setTecido("");
    setDataEntrada(""); setRegistro(""); setComposicao("");
    setQtdeCores(""); setCores([]);
  };

  const limparFiltros = () => {
    setFiltroCliente(""); setFiltroTecido(""); setFiltroOrdem("");
    setFiltroDataDe(""); setFiltroDataAte(""); setFiltroCor("");
  };

  const handleRegistrarClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmRegistrar = async () => {
    setConfirmDialogOpen(false);
    // Save tecido to DB
    const clienteMatch = clientes.find((c: any) => (c.razao_social || "").toLowerCase() === cliente.toLowerCase());
    const totalMetragem = cores.reduce((s, c) => s + (parseFloat(c.metragemTotal) || 0), 0);
    const result = await salvarTecido({
      nome: tecido,
      composicao: composicao || undefined,
      cor: cores.map(c => c.cor).join(", ") || undefined,
      cliente_id: clienteMatch?.id || undefined,
      estoque_kg: totalMetragem,
      preco_kg: 0,
    });
    if (result) {
      toast({ title: "Tecido registrado", description: "As informações foram salvas no banco de dados." });
      limparRegistro();
    }
  };

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const yellowInput =
    "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";

  // ─── HISTÓRICO VIEW ───
  if (viewMode === "historico") {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-[hsl(0,0%,100%)] hover:bg-[hsl(217,71%,35%)] shrink-0"
            onClick={() => setViewMode("ficha")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono flex-1 text-center pr-9">
            HISTÓRICO DE REGISTROS — TECIDOS
          </h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Filtros</h3>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Cliente</Label>
                <Input value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} placeholder="Filtrar..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tecido</Label>
                <Input value={filtroTecido} onChange={(e) => setFiltroTecido(e.target.value)} placeholder="Filtrar..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ordem de Corte</Label>
                <Input value={filtroOrdem} onChange={(e) => setFiltroOrdem(e.target.value)} placeholder="OC-..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data de</Label>
                <Input type="date" value={filtroDataDe} onChange={(e) => setFiltroDataDe(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data até</Label>
                <Input type="date" value={filtroDataAte} onChange={(e) => setFiltroDataAte(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cor</Label>
                <Input value={filtroCor} onChange={(e) => setFiltroCor(e.target.value)} placeholder="Filtrar cor..." className="h-8 text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold">Registro</th>
                    <th className="text-left py-3 px-4 font-semibold">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold">Ordem Corte</th>
                    <th className="text-left py-3 px-4 font-semibold">Tecido</th>
                    <th className="text-left py-3 px-4 font-semibold">Composição</th>
                    <th className="text-left py-3 px-4 font-semibold">Data Entrada</th>
                    <th className="text-left py-3 px-4 font-semibold">Cores</th>
                    <th className="text-center py-3 px-4 font-semibold">Rolos</th>
                    <th className="text-right py-3 px-4 font-semibold">Metragem</th>
                    <th className="text-center py-3 px-4 font-semibold w-16">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistros.map((r) => {
                    const totalRolos = r.cores.reduce((s, c) => s + (parseInt(c.qtdeRolos) || 0), 0);
                    const totalMetragem = r.cores.reduce((s, c) => s + (parseFloat(c.metragemTotal) || 0), 0);
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-primary">{r.registro}</td>
                        <td className="py-3 px-4">{r.cliente}</td>
                        <td className="py-3 px-4 font-mono">{r.ordemCorte}</td>
                        <td className="py-3 px-4 font-medium">{r.tecido}</td>
                        <td className="py-3 px-4 text-muted-foreground">{r.composicao}</td>
                        <td className="py-3 px-4 font-mono">{r.dataEntrada}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {r.cores.map((c, i) => (
                              <span key={i} className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded text-[10px]">
                                {c.cor}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{totalRolos}</td>
                        <td className="py-3 px-4 text-right font-mono">{totalMetragem.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => loadRegistro(r)}
                            title="Editar registro"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRegistros.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground text-sm">
                        Nenhum registro encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-right">
          {filteredRegistros.length} registro(s) encontrado(s)
        </div>
      </div>
    );
  }

  // ─── FICHA VIEW ───
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">ENTRADA DE TECIDO</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Action Panel */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-3 md:w-40 shrink-0 print:hidden overflow-x-auto pb-2 md:pb-0">
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0">
                <Search className="w-4 h-4" />
                <span>Buscar Tecido</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Buscar Tecidos</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, cor ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {filteredTecidos.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => loadTecido(t)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm"
                    >
                      <div className="font-mono text-xs font-semibold text-primary">{t.nome}</div>
                      <div className="text-muted-foreground text-xs">
                        {t.cor} — {t.clientes?.razao_social || ""}
                      </div>
                    </button>
                  ))}
                  {filteredTecidos.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum tecido encontrado</p>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Separator />

          <Separator className="hidden md:block" />

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)]"
            onClick={handleRegistrarClick}
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Tecido</span>
          </Button>

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(217,71%,45%)] hover:bg-[hsl(217,71%,38%)] text-[hsl(0,0%,100%)]"
            onClick={() => setViewMode("historico")}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Conferir</span>
          </Button>

          <Button
            variant="destructive"
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0"
            onClick={limparRegistro}
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Registro</span>
          </Button>

          <Separator className="hidden md:block" />

          <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </Button>
        </div>

        {/* Main Ficha Content */}
        <div className="flex-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Cliente</Label>
                  <Input value={cliente} onChange={(e) => setCliente(e.target.value)} className={yellowInput} placeholder="Nome do cliente" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Ordem de Corte</Label>
                  <Input value={ordemCorte} onChange={(e) => setOrdemCorte(e.target.value)} className={yellowInput} placeholder="OC-0000" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tecido</Label>
                  <Input value={tecido} onChange={(e) => setTecido(e.target.value)} className={yellowInput} placeholder="Nome do tecido" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Modelo</Label>
                  <div className="flex gap-1">
                    <Input value={modeloTecido} onChange={(e) => setModeloTecido(e.target.value)} className={`flex-1 ${yellowInput}`} placeholder="Tipo de modelo" />
                    <Sheet open={modeloSearchOpen} onOpenChange={(open) => {setModeloSearchOpen(open);setModeloSearchTerm("");}}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"><Search className="w-4 h-4" /></Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-80">
                        <SheetHeader><SheetTitle>Buscar Modelo (Cadastro)</SheetTitle></SheetHeader>
                        <div className="mt-4 space-y-3">
                          <Input placeholder="Nome do modelo..." value={modeloSearchTerm} onChange={(e) => setModeloSearchTerm(e.target.value)} />
                          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                            {cadastroModelos.filter(m => m.nome.toLowerCase().includes(modeloSearchTerm.toLowerCase())).map((m) =>
                            <button key={m.id} onClick={() => {setModeloTecido(m.nome);setModeloSearchOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
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
                  <Label className="text-xs font-semibold">Data de Entrada</Label>
                  <Input type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} className={yellowInput} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Registro</Label>
                  <Input value={registro} onChange={(e) => setRegistro(e.target.value)} className={yellowInput} placeholder="Nº registro" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Composição</Label>
                  <Input value={composicao} onChange={(e) => setComposicao(e.target.value)} className={yellowInput} placeholder="Ex: 100% Algodão" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-end gap-4">
                <div className="space-y-1 w-48">
                  <Label className="text-xs font-semibold">Qtde de cores no lote</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={qtdeCores}
                    onChange={(e) => handleQtdeCoresChange(e.target.value)}
                    className={yellowInput}
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-muted-foreground pb-2">
                  Informe a quantidade para gerar os campos de cor abaixo.
                </p>
              </div>
            </CardContent>
          </Card>

          {cores.length > 0 && (
            <Card>
              <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
                <h3 className="text-sm font-bold tracking-wide text-center">CORES DO LOTE</h3>
              </div>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-center py-2 px-3 font-semibold w-10">#</th>
                      <th className="text-left py-2 px-3 font-semibold">COR</th>
                      <th className="text-center py-2 px-3 font-semibold w-20">AMOSTRA</th>
                      <th className="text-left py-2 px-3 font-semibold w-28">CÓD</th>
                      <th className="text-center py-2 px-3 font-semibold w-28">QTDE ROLOS</th>
                      <th className="text-center py-2 px-3 font-semibold w-36">METRAGEM TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cores.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-1.5 px-3 text-center font-mono text-muted-foreground">{idx + 1}</td>
                        <td className="py-1.5 px-3">
                          <Select value={row.cor} onValueChange={(val) => selectCorFromCadastro(idx, val)}>
                            <SelectTrigger className={`h-7 text-xs ${yellowInput}`}>
                              <SelectValue placeholder="Selecione a cor" />
                            </SelectTrigger>
                            <SelectContent>
                              {cadastroCores.map((cc) => (
                                <SelectItem key={cc.cod} value={cc.cor}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full border border-border shrink-0" style={{ backgroundColor: cc.hex }} />
                                    {cc.cor}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="color"
                              value={row.amostraCor || "#ffffff"}
                              onChange={(e) => updateCor(idx, "amostraCor", e.target.value)}
                              className="w-[2.5cm] h-[2.5cm] cursor-pointer border-2 border-[hsl(220,14%,88%)] rounded"
                              title="Selecionar cor de amostra"
                            />
                          </div>
                        </td>
                        <td className="py-1.5 px-3">
                          <Input value={row.cod} readOnly className={`h-7 text-xs ${yellowInput} opacity-70`} placeholder="Auto" />
                        </td>
                        <td className="py-1.5 px-3">
                          <Input value={row.qtdeRolos} onChange={(e) => updateCor(idx, "qtdeRolos", e.target.value)} className={`h-7 text-xs text-center ${yellowInput}`} placeholder="0" />
                        </td>
                        <td className="py-1.5 px-3">
                          <Input value={row.metragemTotal} onChange={(e) => updateCor(idx, "metragemTotal", e.target.value)} className={`h-7 text-xs text-center ${yellowInput}`} placeholder="0.00" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm Register Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Você confirma a inclusão do tecido?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRegistrar} className="bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)]">
              Sim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TecidosPage;
