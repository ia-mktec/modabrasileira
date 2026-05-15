import { useState, useCallback, useEffect } from "react";
import { PageLoading } from "@/components/shared/PageLoading";
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
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { useEntityOptions } from "@/hooks/useEntityOptions";
import { supabase } from "@/integrations/supabase/client";
import { showSaving } from "@/lib/saving-toast";

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

import { Plus, Trash2, Printer, Search, CheckCircle, ArrowLeft, Pencil, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CorRow {
  cor: string;
  cod: string;
  qtdeRolos: string;
  metragemTotal: string;
  amostraCor: string; // hex color for physical sample
}

interface RegistroEntrada {
  id: string;
  cliente_nome: string | null;
  nome_tecido: string;
  composicao: string | null;
  data_entrada: string | null;
  cor: string | null;
  qtde_rolos: number | null;
  unidade_medida: string | null;
  metragem_total: number | null;
  status: string | null;
  ordem_corte1: string | null;
  ordem_corte2: string | null;
}

type ViewMode = "ficha" | "historico" | "cadastro";

const TecidosPage = () => {
  const { tecidos, salvarTecido } = useTecidos();
  const { clientes } = useClientes();
  const { clientes: clienteOptions, tecidos: tecidoOptions } = useEntityOptions();
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

  // Histórico — dados reais
  const [registros, setRegistros] = useState<RegistroEntrada[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);

  useEffect(() => {
    if (viewMode !== "historico") return;
    let cancelled = false;
    (async () => {
      setLoadingRegistros(true);
      let q = supabase
        .from("tecido_entradas")
        .select("id,cliente_nome,nome_tecido,composicao,data_entrada,cor,qtde_rolos,unidade_medida,metragem_total,status,ordem_corte1,ordem_corte2")
        .order("data_entrada", { ascending: false, nullsFirst: false })
        .limit(2000);
      if (filtroCliente) q = q.ilike("cliente_nome", `%${filtroCliente}%`);
      if (filtroTecido) q = q.ilike("nome_tecido", `%${filtroTecido}%`);
      if (filtroCor) q = q.ilike("cor", `%${filtroCor}%`);
      if (filtroDataDe) q = q.gte("data_entrada", filtroDataDe);
      if (filtroDataAte) q = q.lte("data_entrada", filtroDataAte);
      if (filtroOrdem) q = q.or(`ordem_corte1.ilike.%${filtroOrdem}%,ordem_corte2.ilike.%${filtroOrdem}%`);
      const { data, error } = await q;
      if (!cancelled) {
        if (!error) setRegistros((data || []) as RegistroEntrada[]);
        setLoadingRegistros(false);
      }
    })();
    return () => { cancelled = true; };
  }, [viewMode, filtroCliente, filtroTecido, filtroOrdem, filtroDataDe, filtroDataAte, filtroCor]);

  const filteredTecidos = tecidos.filter(
    (t: any) =>
      (t.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.cor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.clientes?.razao_social || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const loadRegistro = (r: RegistroEntrada) => {
    setCliente(r.cliente_nome || "");
    setOrdemCorte(r.ordem_corte1 || "");
    setTecido(r.nome_tecido);
    setDataEntrada(r.data_entrada || "");
    setRegistro("");
    setComposicao(r.composicao || "");
    const corHex = cadastroCores.find(c => c.cor.toLowerCase() === (r.cor || "").toLowerCase())?.hex || "#ffffff";
    const codHex = cadastroCores.find(c => c.cor.toLowerCase() === (r.cor || "").toLowerCase())?.cod || "";
    setQtdeCores("1");
    setCores([{
      cor: r.cor || "",
      cod: codHex,
      qtdeRolos: String(r.qtde_rolos ?? 0),
      metragemTotal: String(r.metragem_total ?? 0),
      amostraCor: corHex,
    }]);
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
    const dismissSaving = showSaving();
    try {
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

      // Também registra a entrada no estoque (tecido_entradas) — uma linha por cor
      const entradas = cores
        .filter((c) => c.cor || c.qtdeRolos || c.metragemTotal)
        .map((c) => ({
          cliente_id: clienteMatch?.id || null,
          cliente_nome: cliente || null,
          nome_tecido: tecido,
          composicao: composicao || null,
          cor: c.cor || null,
          qtde_rolos: parseInt(c.qtdeRolos) || 0,
          metragem_total: parseFloat(c.metragemTotal) || 0,
          unidade_medida: "mt",
          data_entrada: dataEntrada || new Date().toISOString().slice(0, 10),
          ordem_corte1: ordemCorte || null,
          status: "Disponível",
        }));

      let entradaError: any = null;
      if (entradas.length > 0) {
        const { error } = await supabase.from("tecido_entradas").insert(entradas);
        entradaError = error;
      }

      if (result && !entradaError) {
        toast({ title: "Tecido registrado", description: "As informações foram salvas no estoque." });
        limparRegistro();
      } else if (entradaError) {
        toast({
          title: "Erro ao registrar entrada no estoque",
          description: entradaError.message,
          variant: "destructive",
        });
      }
    } finally {
      dismissSaving();
    }
  };

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const yellowInput =
    "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";

  // ─── HISTÓRICO VIEW ───
  if (viewMode === "historico") {
    if (loadingRegistros) {
      return <PageLoading message="Carregando histórico..." />;
    }
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
                    <th className="text-left py-3 px-4 font-semibold">Data Entrada</th>
                    <th className="text-left py-3 px-4 font-semibold">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold">Tecido</th>
                    <th className="text-left py-3 px-4 font-semibold">Composição</th>
                    <th className="text-left py-3 px-4 font-semibold">Cor</th>
                    <th className="text-center py-3 px-4 font-semibold">Rolos</th>
                    <th className="text-right py-3 px-4 font-semibold">Metragem</th>
                    <th className="text-center py-3 px-4 font-semibold">Un.</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">OC 1</th>
                    <th className="text-left py-3 px-4 font-semibold">OC 2</th>
                    <th className="text-center py-3 px-4 font-semibold w-16">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => {
                    const corHex = cadastroCores.find(c => c.cor.toLowerCase() === (r.cor || "").toLowerCase())?.hex;
                    const isDisp = (r.status || "").toLowerCase().startsWith("dispon");
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-4 font-mono">{r.data_entrada ? new Date(r.data_entrada).toLocaleDateString("pt-BR") : "—"}</td>
                        <td className="py-2 px-4">{r.cliente_nome || "—"}</td>
                        <td className="py-2 px-4 font-medium">{r.nome_tecido}</td>
                        <td className="py-2 px-4 text-muted-foreground">{r.composicao || "—"}</td>
                        <td className="py-2 px-4">
                          <span className="inline-flex items-center gap-1.5">
                            {corHex && <span className="w-3 h-3 rounded-full border border-border shrink-0 inline-block" style={{ backgroundColor: corHex }} />}
                            <span>{r.cor || "—"}</span>
                          </span>
                        </td>
                        <td className="py-2 px-4 text-center font-mono">{r.qtde_rolos ?? 0}</td>
                        <td className="py-2 px-4 text-right font-mono">{Number(r.metragem_total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-4 text-center text-muted-foreground">{r.unidade_medida || "—"}</td>
                        <td className="py-2 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            isDisp
                              ? "bg-[hsl(142_71%_35%/0.15)] text-[hsl(142,71%,35%)] border-[hsl(142_71%_35%/0.3)]"
                              : "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)] border-[hsl(38_92%_50%/0.3)]"
                          }`}>{r.status || "—"}</span>
                        </td>
                        <td className="py-2 px-4 font-mono">{r.ordem_corte1 || "—"}</td>
                        <td className="py-2 px-4 font-mono">{r.ordem_corte2 || "—"}</td>
                        <td className="py-2 px-4 text-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadRegistro(r)} title="Editar registro">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {!loadingRegistros && registros.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-muted-foreground text-sm">
                        Nenhum registro encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                  {loadingRegistros && (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-muted-foreground text-sm">Carregando...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-right">
          {registros.length} registro(s){registros.length >= 2000 ? " (limite atingido — refine os filtros)" : ""}
        </div>
      </div>
    );
  }

  // ─── CADASTRO VIEW ───
  if (viewMode === "cadastro") {
    return <CadastroTecidoView onBack={() => setViewMode("ficha")} />;
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
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(262,52%,47%)] hover:bg-[hsl(262,52%,40%)] text-[hsl(0,0%,100%)]"
            onClick={() => setViewMode("cadastro")}
          >
            <FileText className="w-4 h-4" />
            <span>Cadastro de Tecido</span>
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
                  <SearchableSelect
                    options={clienteOptions}
                    value={cliente || null}
                    onChange={(v) => setCliente(v || "")}
                    placeholder="Selecione cliente"
                    searchPlaceholder="Buscar cliente..."
                    className={yellowInput}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Ordem de Corte</Label>
                  <Input value={ordemCorte} onChange={(e) => setOrdemCorte(e.target.value)} className={yellowInput} placeholder="OC-0000" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tecido</Label>
                  <SearchableSelect
                    options={tecidoOptions}
                    value={tecido || null}
                    onChange={(v) => {
                      setTecido(v || "");
                      const found = tecidos.find((t: any) => t.nome === v);
                      if (found) {
                        setComposicao(found.composicao || "");
                        if (found.clientes?.razao_social) {
                          setCliente(found.clientes.razao_social);
                        }
                      } else {
                        setComposicao("");
                      }
                    }}
                    placeholder="Selecione tecido"
                    searchPlaceholder="Buscar tecido..."
                    className={yellowInput}
                  />
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
                                <SelectItem key={cc.cod} value={cc.cor} textValue={cc.cor}>
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full border border-border shrink-0 inline-block" style={{ backgroundColor: cc.hex }} />
                                    <span>{cc.cor}</span>
                                  </span>
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

interface CadastroTecidoViewProps {
  onBack: () => void;
}

function CadastroTecidoView({ onBack }: CadastroTecidoViewProps) {
  const { tecidos, salvarTecido, deletarTecido, loading } = useTecidos();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [composicao, setComposicao] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const yellowInput =
    "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";

  const limpar = () => {
    setEditingId(null);
    setNome("");
    setComposicao("");
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast({ title: "Nome obrigatório", description: "Informe o nome do tecido.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const result = await salvarTecido(
      {
        nome: nome.trim(),
        composicao: composicao.trim() || undefined,
      },
      editingId || undefined,
    );
    setSaving(false);
    if (result) {
      toast({
        title: editingId ? "Tecido atualizado" : "Tecido cadastrado",
        description: "As alterações foram salvas com sucesso.",
      });
      limpar();
    }
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setNome(t.nome || "");
    setComposicao(t.composicao || "");
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    const ok = await deletarTecido(confirmDeleteId);
    if (ok) {
      toast({ title: "Tecido excluído" });
      if (editingId === confirmDeleteId) limpar();
    }
    setConfirmDeleteId(null);
  };

  const filtered = tecidos.filter((t: any) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      (t.nome || "").toLowerCase().includes(term) ||
      (t.composicao || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-[hsl(0,0%,100%)] hover:bg-[hsl(217,71%,35%)] shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono flex-1 text-center pr-9">
          CADASTRO DE TECIDO
        </h1>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">
              {editingId ? "Editar Tecido" : "Novo Tecido"}
            </h3>
            {editingId && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border border-[hsl(48,80%,60%)] font-mono">
                Editando
              </span>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Nome do Tecido *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={yellowInput}
              placeholder="Ex: Malha Cotton 30/1"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Composição</Label>
            <Input
              value={composicao}
              onChange={(e) => setComposicao(e.target.value)}
              className={yellowInput}
              placeholder="Ex: 100% Algodão"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={limpar}>
              {editingId ? "Cancelar" : "Limpar"}
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={saving}
              className="bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)]"
            >
              <Plus className="w-4 h-4" />
              {saving ? "Salvando..." : editingId ? "Atualizar Tecido" : "Cadastrar Tecido"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-5xl mx-auto">
        <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
          <h3 className="text-sm font-bold tracking-wide text-center">TECIDOS CADASTRADOS</h3>
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou composição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-3 font-semibold">Nome</th>
                  <th className="text-left py-2 px-3 font-semibold">Composição</th>
                  <th className="text-left py-2 px-3 font-semibold">Cliente</th>
                  <th className="text-center py-2 px-3 font-semibold w-28">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Carregando...</td></tr>
                )}
                {!loading && filtered.map((t: any) => (
                  <tr key={t.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${editingId === t.id ? "bg-[hsl(48,100%,94%)]" : ""}`}>
                    <td className="py-2 px-3 font-medium">{t.nome}</td>
                    <td className="py-2 px-3 text-muted-foreground">{t.composicao || "—"}</td>
                    <td className="py-2 px-3 text-muted-foreground">{t.clientes?.razao_social || "—"}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(t)} title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setConfirmDeleteId(t.id)} title="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Nenhum tecido encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tecido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}