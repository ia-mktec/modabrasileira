import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { useOrdensCorte, useModelos, useTecidos, useClientes, useAviamentos } from "@/hooks/useSupabaseData";
import { Plus, Save, Trash2, Printer, Search, ImageOff, Scissors, AlertTriangle, CheckCircle, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CreatableCombobox } from "@/components/shared/CreatableCombobox";

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

const normalizeReferencia = (value: string | null | undefined) =>
  String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

const normalizeReferenciaLoose = (value: string | null | undefined) =>
  normalizeReferencia(value).replace(/\s+/g, "");

const getModeloNome = (modelo: any) => {
  const nome = String(modelo?.modelo || "").trim();
  const descricao = String(modelo?.descricao || "").trim();
  return nome || (descricao && descricao !== "-" ? descricao : "");
};

const findModeloByReferencia = (modelos: any[], referencia: string | null | undefined) => {
  const normalized = normalizeReferencia(referencia);
  if (!normalized) return null;
  const loose = normalizeReferenciaLoose(referencia);
  return modelos.find((m: any) => normalizeReferencia(m.referencia) === normalized) ||
    modelos.find((m: any) => normalizeReferenciaLoose(m.referencia) === loose) ||
    null;
};

const CortePage = () => {
  const navigate = useNavigate();
  const { ordens: ordensCorteDb, salvarOrdem, deletarOrdem, loadOrdemDetalhada } = useOrdensCorte();
  const { modelos: modelosDb } = useModelos();
  const { tecidos: tecidosDb, refetch: refetchTecidos } = useTecidos();
  const { clientes: clientesDb } = useClientes();
  const { aviamentos: aviamentosDb } = useAviamentos();
  const [selectedTecidoId, setSelectedTecidoId] = useState("");
  const [currentOrdemId, setCurrentOrdemId] = useState<string | null>(null);
  const [numero, setNumero] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [pedidoSearchOpen, setPedidoSearchOpen] = useState(false);
  const [pedidoSearchTerm, setPedidoSearchTerm] = useState("");
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [modeloRef, setModeloRef] = useState("");
  const [modeloNome, setModeloNome] = useState("");
  const [tecido, setTecido] = useState("");
  const [dataCorte, setDataCorte] = useState("");
  const [cortador, setCortador] = useState("");
  const [enfestador, setEnfestador] = useState("");
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

  // Conferir (histórico) view
  const [viewMode, setViewMode] = useState<"ficha" | "historico">("ficha");
  const [filtroNumero, setFiltroNumero] = useState("");
  const [filtroPedido, setFiltroPedido] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroModelo, setFiltroModelo] = useState("");
  const [filtroTecido, setFiltroTecido] = useState("");
  const [filtroDataDe, setFiltroDataDe] = useState("");
  const [filtroDataAte, setFiltroDataAte] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  // Auto-preenche o nome do modelo quando a referência muda (digitada ou via lista)
  useEffect(() => {
    if (!modeloRef.trim()) {
      setModeloNome("");
      setRefImage(null);
      return;
    }
    const found = findModeloByReferencia(modelosDb, modeloRef);
    if (found) {
      setModeloNome(getModeloNome(found));
      setRefImage(found.imagem_url || null);
    } else {
      setModeloNome("");
      setRefImage(null);
    }
  }, [modeloRef, modelosDb]);

  const filteredOrdens = ordensCorteDb.filter(
    (oc: any) =>
    (oc.numero || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (oc.numero_pedido || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (oc.modelo_ref || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredModelos = modelosDb.filter(
    (m: any) =>
    m.referencia.toLowerCase().includes(modeloSearchTerm.toLowerCase()) ||
    m.descricao.toLowerCase().includes(modeloSearchTerm.toLowerCase())
  );

  // Filtra tecidos pelo cliente selecionado
  const filteredTecidos = tecidosDb.filter(
    (t: any) =>
    t.cliente_id === selectedClienteId && (
    t.nome.toLowerCase().includes(tecidoSearchTerm.toLowerCase()) ||
    (t.cor || "").toLowerCase().includes(tecidoSearchTerm.toLowerCase()))
  );

  // Cores disponíveis: tecidos do mesmo cliente e mesmo nome de tecido selecionado
  const coresDisponiveisData = tecidosDb.filter(
    (t: any) => t.cliente_id === selectedClienteId && t.nome === tecido
  );

  const filteredCores = coresDisponiveisData.filter((t: any) =>
    (t.cor || "").toLowerCase().includes(corSearchTerm.toLowerCase())
  );

  const filteredClientes = clientesDb.filter(
    (c: any) =>
    (c.razao_social || "").toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
    (c.cnpj || "").includes(clienteSearchTerm)
  );

  const filteredAviamentosItems = aviamentosDb.filter(
    (a: any) =>
    (a.descricao || "").toLowerCase().includes(aviamentoSearchTerm.toLowerCase()) ||
    (a.tipo || "").toLowerCase().includes(aviamentoSearchTerm.toLowerCase())
  );

  const loadOrdem = async (oc: any) => {
    // Se vier da lista enxuta (sem joins), busca a ordem completa sob demanda
    if (oc && !oc.grade_corte && !oc.aviamentos_ordem && oc.id) {
      const full = await loadOrdemDetalhada(oc.id);
      if (full) oc = full;
    }
    setCurrentOrdemId(oc.id);
    setNumero(oc.numero);
    setNumeroPedido(oc.numero_pedido || "");
    setModeloRef(oc.modelo_ref || "");
    const foundModelo = findModeloByReferencia(modelosDb, oc.modelo_ref);
    setModeloNome(getModeloNome(foundModelo));
    setRefImage(foundModelo?.imagem_url || null);
    setTecido(oc.tecido_nome || "");
    setSelectedTecidoId(oc.tecido_id || "");
    setSelectedClienteId(oc.cliente_id || "");
    const foundCliente = clientesDb.find((c: any) => c.id === oc.cliente_id);
    setClienteNome(foundCliente?.razao_social || "");
    setDataCorte(oc.data_corte || "");
    setCortador(oc.cortador || "");
    setEnfestador(oc.enfestador || "");
    setConsumoPorPeca(String(oc.consumo_por_peca || ""));
    setObservacoes(oc.observacoes || "");
    setStatus(oc.status || "");
    // Load grade
    if (oc.grade_corte && oc.grade_corte.length > 0) {
      setGradeRows(oc.grade_corte.map((g: any) => ({
        id: g.id || crypto.randomUUID(),
        cor: g.cor || "",
        tecidoId: g.tecido_id || "",
        quantidades: {
          PP: String(g.pp || ""), P: String(g.p || ""), M: String(g.m || ""),
          G: String(g.g || ""), GG: String(g.gg || ""), G1: String(g.g1 || ""),
          G2: String(g.g2 || ""), G3: String(g.g3 || ""),
        }
      })));
    } else {
      setGradeRows([createEmptyGradeRow()]);
    }
    // Load aviamentos
    if (oc.aviamentos_ordem && oc.aviamentos_ordem.length > 0) {
      setAviamentos(oc.aviamentos_ordem.map((a: any) => ({
        id: a.id || crypto.randomUUID(),
        descricao: a.descricao || "",
        quantidade: String(a.quantidade || ""),
      })));
    } else {
      setAviamentos([]);
    }
    setSearchOpen(false);
    setIsLoadedFromSearch(true);
  };

  const limparCampos = () => {
    setCurrentOrdemId(null);
    setNumero("");setNumeroPedido("");setModeloRef("");setModeloNome("");setTecido("");setSelectedTecidoId("");
    setDataCorte("");setCortador("");
    setEnfestador("");setStatus("");
    setObservacoes("");setConsumoPorPeca("");
    setSelectedClienteId("");setClienteNome("");
    setGradeRows([createEmptyGradeRow()]);
    setAviamentos([]);
    setRefImage(null);
    setIsLoadedFromSearch(false);
    setReservaAtiva(false);
  };

  // Carrega pedidos de modelos
  useEffect(() => {
    const loadPedidos = async () => {
      const { data } = await supabase
        .from("modelo_pedidos")
        .select("*")
        .order("created_at", { ascending: false });
      setPedidos(data || []);
    };
    loadPedidos();
  }, []);

  const filteredPedidos = pedidos.filter(
    (p: any) =>
      (p.numero_pedido || "").toLowerCase().includes(pedidoSearchTerm.toLowerCase()) ||
      (p.modelo_ref || "").toLowerCase().includes(pedidoSearchTerm.toLowerCase()) ||
      (p.cliente || "").toLowerCase().includes(pedidoSearchTerm.toLowerCase())
  );

  const aplicarPedido = (p: any) => {
    setNumeroPedido(p.numero_pedido);
    setModeloRef(p.modelo_ref || "");
    const foundModelo = findModeloByReferencia(modelosDb, p.modelo_ref);
    setModeloNome(getModeloNome(foundModelo));
    setRefImage(foundModelo?.imagem_url || null);
    if (p.tecido) setTecido(p.tecido);
    if (p.consumo_tecido) setConsumoPorPeca(String(p.consumo_tecido));
    if (p.cliente) {
      const cli = clientesDb.find((c: any) => c.razao_social === p.cliente);
      if (cli) {
        setSelectedClienteId(cli.id);
        setClienteNome(cli.razao_social);
      } else {
        setClienteNome(p.cliente);
      }
    }
    setPedidoSearchOpen(false);
    toast({ title: "Pedido carregado", description: `Dados do pedido ${p.numero_pedido} aplicados.` });
  };

  // Total geral vem da grade de tamanhos
  const totalBySize = (tam: string) =>
  gradeRows.reduce((sum, r) => sum + (parseInt(r.quantidades[tam]) || 0), 0);
  const totalGeral = TAMANHOS.reduce((sum, t) => sum + totalBySize(t), 0);

  const consumoTotal = totalGeral * (parseFloat(consumoPorPeca) || 0);

  const handleSave = async () => {
    if (!numero || !modeloRef || !tecido) {
      toast({ title: "Campos obrigatórios", description: "Preencha ao menos Nº Ordem, Modelo e Tecido.", variant: "destructive" });
      return;
    }
    if (!selectedClienteId) {
      toast({ title: "Cliente não selecionado", description: "Selecione um cliente antes de salvar.", variant: "destructive" });
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

    const foundModelo = findModeloByReferencia(modelosDb, modeloRef);

    const ordemData = {
      numero,
      modelo_ref: modeloRef,
      modelo_id: foundModelo?.id || null,
      tecido_nome: tecido,
      tecido_id: selectedTecidoId || null,
      cliente_id: selectedClienteId || null,
      quantidade_pecas: totalGeral,
      data_corte: dataCorte || null,
      cortador: cortador || null,
      enfestador: enfestador || null,
      perda_percent: 0,
      consumo_por_peca: parseFloat(consumoPorPeca) || 0,
      observacoes: observacoes || null,
      status: status || "pendente",
      numero_pedido: numeroPedido || null,
    };

    const gradeData = rowsComQtd.map((row) => ({
      cor: row.cor,
      tecido_id: row.tecidoId || null,
      pp: parseInt(row.quantidades.PP) || 0,
      p: parseInt(row.quantidades.P) || 0,
      m: parseInt(row.quantidades.M) || 0,
      g: parseInt(row.quantidades.G) || 0,
      gg: parseInt(row.quantidades.GG) || 0,
      g1: parseInt(row.quantidades.G1) || 0,
      g2: parseInt(row.quantidades.G2) || 0,
      g3: parseInt(row.quantidades.G3) || 0,
    }));

    const aviamentosData = aviamentos
      .filter(a => a.descricao && parseInt(a.quantidade) > 0)
      .map(a => ({ descricao: a.descricao, quantidade: parseInt(a.quantidade) || 0 }));

    const result = await salvarOrdem(ordemData, gradeData, aviamentosData, currentOrdemId || undefined);
    if (result) {
      setCurrentOrdemId(result);
      toast({
        title: currentOrdemId ? "Ordem atualizada" : "Ordem salva",
        description: `Ordem ${numero} salva com sucesso. ${totalGeral} peças.`
      });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
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

  const limparFiltros = () => {
    setFiltroNumero(""); setFiltroPedido(""); setFiltroCliente(""); setFiltroModelo("");
    setFiltroTecido(""); setFiltroDataDe(""); setFiltroDataAte(""); setFiltroStatus("");
  };

  const ordensFiltradas = ordensCorteDb.filter((oc: any) => {
    if (filtroNumero && !(oc.numero || "").toLowerCase().includes(filtroNumero.toLowerCase())) return false;
    if (filtroPedido && !(oc.numero_pedido || "").toLowerCase().includes(filtroPedido.toLowerCase())) return false;
    if (filtroModelo && !(oc.modelo_ref || "").toLowerCase().includes(filtroModelo.toLowerCase())) return false;
    if (filtroTecido && !(oc.tecido_nome || "").toLowerCase().includes(filtroTecido.toLowerCase())) return false;
    if (filtroStatus && oc.status !== filtroStatus) return false;
    if (filtroCliente) {
      const nome = clientesDb.find((c: any) => c.id === oc.cliente_id)?.razao_social || "";
      if (!nome.toLowerCase().includes(filtroCliente.toLowerCase())) return false;
    }
    if (filtroDataDe && (!oc.data_corte || oc.data_corte < filtroDataDe)) return false;
    if (filtroDataAte && (!oc.data_corte || oc.data_corte > filtroDataAte)) return false;
    return true;
  });

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
            HISTÓRICO DE ORDENS DE CORTE
          </h1>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Filtros</h3>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nº Ordem</Label>
                <Input value={filtroNumero} onChange={(e) => setFiltroNumero(e.target.value)} placeholder="OC-..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nº Pedido</Label>
                <Input value={filtroPedido} onChange={(e) => setFiltroPedido(e.target.value)} placeholder="Filtrar..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cliente</Label>
                <Input value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} placeholder="Filtrar..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Modelo</Label>
                <Input value={filtroModelo} onChange={(e) => setFiltroModelo(e.target.value)} placeholder="Ref..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tecido</Label>
                <Input value={filtroTecido} onChange={(e) => setFiltroTecido(e.target.value)} placeholder="Filtrar..." className="h-8 text-xs" />
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
                <Label className="text-xs">Status</Label>
                <Select value={filtroStatus || "todos"} onValueChange={(v) => setFiltroStatus(v === "todos" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-3 font-semibold">Data Corte</th>
                    <th className="text-left py-3 px-3 font-semibold">Nº Ordem</th>
                    <th className="text-left py-3 px-3 font-semibold">Nº Pedido</th>
                    <th className="text-left py-3 px-3 font-semibold">Cliente</th>
                    <th className="text-left py-3 px-3 font-semibold">Modelo</th>
                    <th className="text-left py-3 px-3 font-semibold">Tecido</th>
                    <th className="text-right py-3 px-3 font-semibold">Peças</th>
                    <th className="text-left py-3 px-3 font-semibold">Cortador</th>
                    <th className="text-center py-3 px-3 font-semibold">Status</th>
                    <th className="text-center py-3 px-3 font-semibold w-16">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {ordensFiltradas.map((oc: any) => {
                    const clienteN = clientesDb.find((c: any) => c.id === oc.cliente_id)?.razao_social || "—";
                    return (
                      <tr key={oc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 font-mono">{oc.data_corte ? new Date(oc.data_corte).toLocaleDateString("pt-BR") : "—"}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-primary">{oc.numero}</td>
                        <td className="py-2 px-3 font-mono">{oc.numero_pedido || "—"}</td>
                        <td className="py-2 px-3">{clienteN}</td>
                        <td className="py-2 px-3 font-mono">{oc.modelo_ref || "—"}</td>
                        <td className="py-2 px-3">{oc.tecido_nome || "—"}</td>
                        <td className="py-2 px-3 text-right font-mono">{oc.quantidade_pecas ?? 0}</td>
                        <td className="py-2 px-3">{oc.cortador || "—"}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-muted/50">
                            {statusLabel(oc.status) || "—"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Editar ordem"
                            onClick={() => { loadOrdem(oc); setViewMode("ficha"); }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {ordensFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground text-sm">
                        Nenhuma ordem encontrada com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-right">
          {ordensFiltradas.length} ordem(ns)
        </div>
      </div>
    );
  }

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
                  <Input placeholder="Nº Ordem, Nº Pedido ou modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {filteredOrdens.map((oc: any) =>
                  <button key={oc.id} onClick={() => loadOrdem(oc)} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                      <div className="font-mono text-xs font-semibold text-primary">{oc.numero}</div>
                      {oc.numero_pedido && <div className="text-[10px] font-mono text-muted-foreground">Pedido: {oc.numero_pedido}</div>}
                      <div className="text-muted-foreground text-xs">{oc.modelo_ref} — {oc.tecido_nome}</div>
                      <div className="text-muted-foreground text-[10px]">{statusLabel(oc.status)} • {oc.quantidade_pecas} peças</div>
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

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(217,71%,45%)] hover:bg-[hsl(217,71%,38%)] text-[hsl(0,0%,100%)]"
            onClick={() => setViewMode("historico")}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Conferir</span>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nº Ordem</Label>
                  <Input value={numero} onChange={(e) => setNumero(e.target.value)} className={yellowInput} placeholder="OC-0000" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nº Pedido</Label>
                  <div className="flex gap-1">
                    <Input value={numeroPedido} onChange={(e) => setNumeroPedido(e.target.value)} className={`flex-1 ${yellowInput}`} placeholder="Buscar pedido" />
                    <Sheet open={pedidoSearchOpen} onOpenChange={(open) => { setPedidoSearchOpen(open); setPedidoSearchTerm(""); }}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"><Search className="w-4 h-4" /></Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-80">
                        <SheetHeader><SheetTitle>Buscar Nº de Pedido</SheetTitle></SheetHeader>
                        <div className="mt-4 space-y-3">
                          <Input placeholder="Pedido, modelo ou cliente..." value={pedidoSearchTerm} onChange={(e) => setPedidoSearchTerm(e.target.value)} />
                          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                            {filteredPedidos.map((p: any) => (
                              <button key={p.numero_pedido} onClick={() => aplicarPedido(p)} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                                <div className="font-mono text-xs font-semibold text-primary">{p.numero_pedido}</div>
                                <div className="text-muted-foreground text-xs">{p.modelo_ref} — {p.cliente || "—"}</div>
                                <div className="text-muted-foreground text-[10px]">{p.tecido || ""} {p.cor ? `• ${p.cor}` : ""}</div>
                              </button>
                            ))}
                            {filteredPedidos.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido encontrado</p>
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
                            {filteredClientes.map((c: any) =>
                            <button key={c.id} onClick={() => {
                              setSelectedClienteId(c.id);
                              setClienteNome(c.razao_social);
                              setClienteSearchOpen(false);
                              // Limpa tecido ao trocar cliente
                              setTecido("");
                              setSelectedTecidoId("");
                            }} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                                <div className="font-mono text-xs font-semibold text-primary">{c.razao_social}</div>
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
                            <button key={m.id} onClick={() => {setModeloRef(m.referencia);setModeloNome(getModeloNome(m));setRefImage(m.imagem_url || null);setModeloSearchOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                                <div className="font-mono text-xs font-semibold text-primary">{m.referencia}</div>
                                <div className="text-muted-foreground text-xs">{getModeloNome(m) || m.descricao}</div>
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
                            {filteredTecidos.map((t: any) =>
                            <button key={t.id} onClick={() => {setTecido(t.nome);setSelectedTecidoId(t.id);setTecidoSearchOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                                <div className="font-mono text-xs font-semibold text-primary">{t.nome}</div>
                                <div className="text-muted-foreground text-xs">{t.cor} — {t.clientes?.razao_social || ""}</div>
                                <div className="text-muted-foreground text-[10px]">Estoque: {t.estoque_kg} Kg</div>
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
                    <CreatableCombobox
                      options={cortadorOptions}
                      value={cortador}
                      onChange={setCortador}
                      placeholder="Nome do cortador"
                      triggerClassName={yellowInput}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Enfestador</Label>
                    <CreatableCombobox
                      options={enfestadorOptions}
                      value={enfestador}
                      onChange={setEnfestador}
                      placeholder="Nome do enfestador"
                      triggerClassName={yellowInput}
                    />
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
                  {selectedTecidoId && (() => {
                    const tecidoSel = tecidosDb.find((t: any) => t.id === selectedTecidoId);
                    const estoqueDisp = tecidoSel?.estoque_kg || 0;
                    return (
                    <div className="space-y-1 col-span-2 md:col-span-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold">Estoque disponível:</span>
                        <span className="font-mono font-bold text-primary">
                          {Number(estoqueDisp).toFixed(2)} Kg
                        </span>
                      </div>
                    </div>
                    );
                  })()
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
                      {filteredAviamentosItems.map((a: any) =>
                      <button
                        key={a.id}
                        onClick={() => addAviamento(a.descricao)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                        
                          <div className="font-mono text-xs font-semibold text-primary">{a.descricao}</div>
                          <div className="text-muted-foreground text-xs">{a.tipo} — {a.cor} — R$ {Number(a.preco_un || 0).toFixed(2)}</div>
                        </button>
                      )}
                      {filteredAviamentosItems.length === 0 &&
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
                const disponivel = Number(t.estoque_kg || 0);
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