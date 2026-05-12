import { useState, useCallback } from "react";
import { PageLoading } from "@/components/shared/PageLoading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useOrdensCorte, useExpedicao, useFornecedores, useModelos } from "@/hooks/useSupabaseData";
import { Search, Truck, Printer, PackageCheck, ImageOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TAMANHOS = ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"];
const TAM_KEYS: Record<string, string> = { PP: "pp", P: "p", M: "m", G: "g", GG: "gg", G1: "g1", G2: "g2", G3: "g3" };

interface GradeExpRow {
  id: string;
  cor: string;
  qtdProduzida: Record<string, number>;
  qtdEnviadaAnterior: Record<string, number>;
  qtdEnviar: Record<string, string>;
}

// Gradação de aviamentos from Modelos
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

const ExpedicaoPage = () => {
  const { ordens: ordensCorteDb, loading: loadingOrdens } = useOrdensCorte();
  const { expedicoes: expedicoesDb, salvarExpedicao } = useExpedicao();
  const { fornecedores: fornecedoresDb } = useFornecedores();
  const { modelos: modelosDb, loading: loadingModelos } = useModelos();
  const [currentOrdemCorteId, setCurrentOrdemCorteId] = useState<string | null>(null);
  // Dados da ordem (consulta - read only)
  const [numero, setNumero] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [modeloRef, setModeloRef] = useState("");
  const [modeloNome, setModeloNome] = useState("");
  const [tecido, setTecido] = useState("");
  const [dataCorte, setDataCorte] = useState("");
  const [cortador, setCortador] = useState("");
  const [statusOrdem, setStatusOrdem] = useState("");
  const [cliente, setCliente] = useState("");

  // Dados editáveis da expedição (amarelo)
  const [dataSaida, setDataSaida] = useState("");
  const [oficina, setOficina] = useState("");
  const [oficinaSearchOpen, setOficinaSearchOpen] = useState(false);
  const [oficinaSearchTerm, setOficinaSearchTerm] = useState("");
  const [preco, setPreco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [statusKanban, setStatusKanban] = useState("");

  // Imagem da referência
  const [refImage, setRefImage] = useState<string | null>(null);

  // Grade (consulta only)
  const [gradeRows, setGradeRows] = useState<GradeExpRow[]>([]);

  // Aviamentos do modelo (consulta) with envio (editável)
  const [aviamentosExp, setAviamentosExp] = useState<{id: string;descricao: string;tipo: string;qtdModelo: number;qtdEnvio: string;}[]>([]);

  // Gradação de aviamentos (consulta from Modelos)
  const [gradacaoRows, setGradacaoRows] = useState<GradacaoRow[]>([]);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const filteredOrdens = ordensCorteDb.filter(
    (oc: any) =>
    (oc.numero || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (oc.numero_pedido || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    setNumero(oc.numero);
    setNumeroPedido(oc.numero_pedido || "");
    setModeloRef(oc.modelo_ref || "");
    const foundModelo = modelosDb.find((m: any) => m.referencia === oc.modelo_ref);
    setModeloNome(foundModelo?.descricao || "");
    setTecido(oc.tecido_nome || "");
    setDataCorte(oc.data_corte || "");
    setCortador(oc.cortador || "");
    setStatusOrdem(oc.status || "");
    setCliente("");

    // Compute already shipped quantities (sum across previous expedicoes for this OC)
    const prevExps = (expedicoesDb || []).filter((e: any) => e.ordem_corte_id === oc.id);
    const enviadoPorCor: Record<string, Record<string, number>> = {};
    prevExps.forEach((e: any) => {
      (e.grade_expedicao || []).forEach((g: any) => {
        const cor = g.cor || "";
        if (!enviadoPorCor[cor]) enviadoPorCor[cor] = {};
        TAMANHOS.forEach((t) => {
          const k = `${TAM_KEYS[t]}_exp`;
          enviadoPorCor[cor][t] = (enviadoPorCor[cor][t] || 0) + (g[k] || 0);
        });
      });
    });

    // Load grade from ordem corte
    if (oc.grade_corte && oc.grade_corte.length > 0) {
      setGradeRows(oc.grade_corte.map((g: any) => {
        const cor = g.cor || "";
        const enviada = enviadoPorCor[cor] || {};
        return {
          id: g.id || crypto.randomUUID(),
          cor,
          qtdProduzida: {
            PP: g.pp || 0, P: g.p || 0, M: g.m || 0, G: g.g || 0,
            GG: g.gg || 0, G1: g.g1 || 0, G2: g.g2 || 0, G3: g.g3 || 0,
          },
          qtdEnviadaAnterior: {
            PP: enviada.PP || 0, P: enviada.P || 0, M: enviada.M || 0, G: enviada.G || 0,
            GG: enviada.GG || 0, G1: enviada.G1 || 0, G2: enviada.G2 || 0, G3: enviada.G3 || 0,
          },
          qtdEnviar: { PP: "", P: "", M: "", G: "", GG: "", G1: "", G2: "", G3: "" },
        };
      }));
    } else {
      setGradeRows([]);
    }

    // Load aviamentos from ordem
    if (oc.aviamentos_ordem && oc.aviamentos_ordem.length > 0) {
      setAviamentosExp(oc.aviamentos_ordem.map((a: any) => ({
        id: a.id || crypto.randomUUID(),
        descricao: a.descricao || "",
        tipo: "",
        qtdModelo: a.quantidade || 0,
        qtdEnvio: "",
      })));
    } else {
      setAviamentosExp([]);
    }

    setGradacaoRows([]);
    const foundModeloImg = modelosDb.find((m: any) => m.referencia === oc.modelo_ref);
    setRefImage(foundModeloImg?.imagem_url || null);
    setSearchOpen(false);
    setIsLoaded(true);
    setDataSaida("");
    setOficina("");
    setPreco("");
    setObservacoes("");
    setStatusKanban("");
  };

  const updateQtdEnviar = (rowId: string, tam: string, val: string) =>
    setGradeRows((prev) => prev.map((r) => r.id === rowId ? { ...r, qtdEnviar: { ...r.qtdEnviar, [tam]: val } } : r));

  const totalProdBySize = (tam: string) => gradeRows.reduce((s, r) => s + (r.qtdProduzida[tam] || 0), 0);
  const totalProdGeral = TAMANHOS.reduce((s, t) => s + totalProdBySize(t), 0);
  const saldoCell = (row: GradeExpRow, tam: string) =>
    Math.max(0, (row.qtdProduzida[tam] || 0) - (row.qtdEnviadaAnterior[tam] || 0));
  const totalEnviarRow = (row: GradeExpRow) =>
    TAMANHOS.reduce((s, t) => s + (parseInt(row.qtdEnviar[t]) || 0), 0);
  const totalEnviarGeral = gradeRows.reduce((s, r) => s + totalEnviarRow(r), 0);

  const updateAviamentoEnvio = (id: string, val: string) =>
  setAviamentosExp((prev) => prev.map((a) => a.id === id ? { ...a, qtdEnvio: val } : a));

  const handleRegistrarSaida = async () => {
    if (!numero || !currentOrdemCorteId) {
      toast({ title: "Nenhuma ordem carregada", description: "Busque uma ordem de corte primeiro.", variant: "destructive" });
      return;
    }
    if (!dataSaida) {
      toast({ title: "Campo obrigatório", description: "Preencha a data de saída.", variant: "destructive" });
      return;
    }
    if (!oficina) {
      toast({ title: "Campo obrigatório", description: "Informe a oficina/prestador desta saída.", variant: "destructive" });
      return;
    }

    // Validação de saldo + filtra apenas linhas com quantidade enviada
    const gradeData: any[] = [];
    for (const row of gradeRows) {
      const qtdEnviar: Record<string, number> = {};
      let rowTotal = 0;
      for (const t of TAMANHOS) {
        const v = parseInt(row.qtdEnviar[t]) || 0;
        if (v < 0) continue;
        if (v > saldoCell(row, t)) {
          toast({ title: "Quantidade excede o saldo", description: `Cor ${row.cor} tamanho ${t}: saldo disponível ${saldoCell(row, t)}.`, variant: "destructive" });
          return;
        }
        qtdEnviar[t] = v;
        rowTotal += v;
      }
      if (rowTotal === 0) continue;
      gradeData.push({
        cor: row.cor,
        pp_prod: qtdEnviar.PP || 0, p_prod: qtdEnviar.P || 0,
        m_prod: qtdEnviar.M || 0, g_prod: qtdEnviar.G || 0,
        gg_prod: qtdEnviar.GG || 0, g1_prod: qtdEnviar.G1 || 0,
        g2_prod: qtdEnviar.G2 || 0, g3_prod: qtdEnviar.G3 || 0,
        pp_exp: qtdEnviar.PP || 0, p_exp: qtdEnviar.P || 0,
        m_exp: qtdEnviar.M || 0, g_exp: qtdEnviar.G || 0,
        gg_exp: qtdEnviar.GG || 0, g1_exp: qtdEnviar.G1 || 0,
        g2_exp: qtdEnviar.G2 || 0, g3_exp: qtdEnviar.G3 || 0,
      });
    }

    if (gradeData.length === 0) {
      toast({ title: "Nenhuma quantidade informada", description: "Informe a quantidade a enviar nesta saída parcial.", variant: "destructive" });
      return;
    }

    const result = await salvarExpedicao({
      ordem_corte_id: currentOrdemCorteId,
      data_saida: dataSaida || null,
      oficina_nome: oficina || null,
      destino: cliente || null,
      preco_peca: parseFloat(preco) || 0,
      observacoes: observacoes || null,
      status: statusKanban || "pendente",
    }, gradeData);

    if (result) {
      toast({ title: "Saída parcial registrada", description: `Oficina ${oficina} — ${totalEnviarGeral} peça(s).` });
      // Recarrega a ordem para atualizar saldos e limpar formulário
      const refreshed = ordensCorteDb.find((o: any) => o.id === currentOrdemCorteId);
      if (refreshed) loadOrdem(refreshed);
    }
  };

  const handlePrint = useCallback(() => {window.print();}, []);

  const yellowInput =
  "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";

  const readOnlyInput =
  "bg-muted text-foreground border-border cursor-default";

  if (loadingOrdens || loadingModelos) {
    return <PageLoading message="Carregando expedição..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">EXPEDIÇÃO — SAÍDA DE OFICINA</h1>
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

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)]"
            onClick={handleRegistrarSaida}>
            
            <PackageCheck className="w-4 h-4" />
            <span>Registrar Saída</span>
          </Button>

          <Separator className="hidden md:block" />

          <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </Button>
        </div>

        {/* Main Ficha Content */}
        <div className="flex-1 space-y-4">
          {/* Dados da Ordem — Consulta (read-only) */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">DADOS DA ORDEM</h3>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nº Ordem</Label>
                  <Input value={numero} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nº Pedido</Label>
                  <Input value={numeroPedido} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Referência</Label>
                  <Input value={modeloRef} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Modelo</Label>
                  <Input value={modeloNome} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tecido</Label>
                  <Input value={tecido} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Cliente</Label>
                  <Input value={cliente} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Data do Corte</Label>
                  <Input value={dataCorte} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Cortador</Label>
                  <Input value={cortador} readOnly className={readOnlyInput} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Qtde Peças</Label>
                  <Input value={totalProdGeral > 0 ? String(totalProdGeral) : ""} readOnly className={readOnlyInput} placeholder="—" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados da Expedição + Imagem lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-4">
            <Card>
              <div className="bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
                <h3 className="text-sm font-bold tracking-wide text-center">DADOS DA EXPEDIÇÃO</h3>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Data de Saída</Label>
                    <Input type="date" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} className={yellowInput} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Oficina</Label>
                    <div className="flex gap-1">
                      <Input value={oficina} onChange={(e) => setOficina(e.target.value)} className={`flex-1 ${yellowInput}`} placeholder="Nome da oficina" />
                      <Sheet open={oficinaSearchOpen} onOpenChange={(open) => {setOficinaSearchOpen(open);setOficinaSearchTerm("");}}>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"><Search className="w-4 h-4" /></Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80">
                          <SheetHeader><SheetTitle>Buscar Oficina / Fornecedor</SheetTitle></SheetHeader>
                          <div className="mt-4 space-y-3">
                            <Input placeholder="Razão social ou cidade..." value={oficinaSearchTerm} onChange={(e) => setOficinaSearchTerm(e.target.value)} />
                            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                              {fornecedoresDb.
                              filter((f: any) =>
                              (f.razao_social || "").toLowerCase().includes(oficinaSearchTerm.toLowerCase()) ||
                              (f.cidade || "").toLowerCase().includes(oficinaSearchTerm.toLowerCase())
                              ).
                              map((f: any) =>
                              <button key={f.id} onClick={() => {setOficina(f.razao_social);setOficinaSearchOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                                    <div className="font-mono text-xs font-semibold text-primary">{f.razao_social}</div>
                                    <div className="text-muted-foreground text-xs">{f.cidade}/{f.uf} — {f.tipo}</div>
                                    <div className="text-muted-foreground text-[10px]">{f.contato} • {f.telefone}</div>
                                  </button>
                              )}
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Preço (R$)</Label>
                    <Input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className={yellowInput} placeholder="0,00" />
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
                <h3 className="text-xs font-bold tracking-wide text-center">IMAGEM REF. </h3>
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

          {/* Grade de Tamanhos (consulta only) */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">GRADE DE TAMANHOS</h3>
            </div>
            <CardContent className="p-3">
              {currentOrdemCorteId && (() => {
                const prev = (expedicoesDb || []).filter((e: any) => e.ordem_corte_id === currentOrdemCorteId);
                if (prev.length === 0) return null;
                return (
                  <div className="mb-3 p-2 rounded bg-muted/40 border border-border">
                    <div className="text-[11px] font-semibold mb-1">Saídas parciais já registradas ({prev.length})</div>
                    <ul className="text-[11px] space-y-0.5">
                      {prev.map((e: any) => {
                        const total = (e.grade_expedicao || []).reduce((s: number, g: any) =>
                          s + TAMANHOS.reduce((ss, t) => ss + (g[`${TAM_KEYS[t]}_exp`] || 0), 0), 0);
                        return (
                          <li key={e.id} className="flex justify-between gap-2">
                            <span className="font-mono">{e.data_saida || "—"}</span>
                            <span className="flex-1 truncate">{e.oficina_nome || "—"}</span>
                            <span className="font-semibold">{total} pç</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })()}
              {gradeRows.length === 0 ?
              <div className="py-8 text-center">
                  <Truck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Busque uma ordem para ver a grade de tamanhos.</p>
                </div> :

              <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-2 py-1.5 text-left font-semibold w-20">COR</th>
                        <th className="px-1 py-1.5 text-center font-semibold w-20">TIPO</th>
                        {TAMANHOS.map((t) =>
                      <th key={t} className="px-1 py-1.5 text-center font-semibold w-14">{t}</th>
                      )}
                        <th className="px-2 py-1.5 text-center font-semibold w-16">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeRows.flatMap((row) => {
                      const totalProd = TAMANHOS.reduce((s, t) => s + (row.qtdProduzida[t] || 0), 0);
                      const totalEnviado = TAMANHOS.reduce((s, t) => s + (row.qtdEnviadaAnterior[t] || 0), 0);
                      const totalSaldo = TAMANHOS.reduce((s, t) => s + saldoCell(row, t), 0);
                      const totalEnv = totalEnviarRow(row);
                      return [
                        <tr key={`${row.id}-prod`}>
                          <td className="px-2 py-0.5 font-medium align-top" rowSpan={4}>{row.cor}</td>
                          <td className="px-1 py-0.5 text-[10px] text-muted-foreground text-right pr-2">Produzido</td>
                          {TAMANHOS.map((t) =>
                            <td key={t} className="px-1 py-0.5 text-center">
                              <div className="bg-muted rounded px-1 py-0.5 text-center font-mono">{row.qtdProduzida[t] || 0}</div>
                            </td>
                          )}
                          <td className="px-2 py-0.5 text-center font-bold bg-muted rounded">{totalProd}</td>
                        </tr>,
                        <tr key={`${row.id}-env`}>
                          <td className="px-1 py-0.5 text-[10px] text-muted-foreground text-right pr-2">Já enviado</td>
                          {TAMANHOS.map((t) =>
                            <td key={t} className="px-1 py-0.5 text-center font-mono text-muted-foreground">{row.qtdEnviadaAnterior[t] || 0}</td>
                          )}
                          <td className="px-2 py-0.5 text-center font-mono text-muted-foreground">{totalEnviado}</td>
                        </tr>,
                        <tr key={`${row.id}-saldo`}>
                          <td className="px-1 py-0.5 text-[10px] text-muted-foreground text-right pr-2">Saldo</td>
                          {TAMANHOS.map((t) =>
                            <td key={t} className="px-1 py-0.5 text-center">
                              <div className="bg-[hsl(199,89%,90%)] rounded px-1 py-0.5 text-center font-mono font-semibold text-[hsl(199,89%,25%)]">{saldoCell(row, t)}</div>
                            </td>
                          )}
                          <td className="px-2 py-0.5 text-center font-mono font-semibold text-[hsl(199,89%,25%)]">{totalSaldo}</td>
                        </tr>,
                        <tr key={`${row.id}-enviar`} className="border-b-2">
                          <td className="px-1 py-0.5 text-[10px] font-semibold text-right pr-2">Enviar agora</td>
                          {TAMANHOS.map((t) => {
                            const max = saldoCell(row, t);
                            return (
                              <td key={t} className="px-1 py-0.5 text-center">
                                <Input type="number" min="0" max={max} value={row.qtdEnviar[t]}
                                  onChange={(e) => updateQtdEnviar(row.id, t, e.target.value)}
                                  disabled={max === 0}
                                  className={`h-7 text-xs text-center ${yellowInput}`} placeholder="0" />
                              </td>
                            );
                          })}
                          <td className="px-2 py-0.5 text-center font-bold">{totalEnv}</td>
                        </tr>,
                      ];
                    })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td className="px-2 py-1.5" colSpan={2}>TOTAL ENVIAR</td>
                        {TAMANHOS.map((t) =>
                      <td key={t} className="px-1 py-1.5 text-center">{gradeRows.reduce((s, r) => s + (parseInt(r.qtdEnviar[t]) || 0), 0)}</td>
                      )}
                        <td className="px-2 py-1.5 text-center">{totalEnviarGeral}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              }
            </CardContent>
          </Card>

          {/* Gradação de Aviamentos (consulta from Modelos) */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">GRADAÇÃO DE AVIAMENTOS</h3>
            </div>
            <CardContent className="p-3">
              {gradacaoRows.length === 0 ?
              <p className="text-sm text-muted-foreground text-center py-6">Busque uma ordem para ver a gradação de aviamentos.</p> :

              <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-1.5 text-left font-semibold">Descrição</th>
                        <th className="px-2 py-1.5 text-center font-semibold w-20">Aum. (cm)</th>
                        {TAMANHOS.map((t) =>
                      <th key={t} className="px-1 py-1.5 text-center font-semibold w-14">{t}</th>
                      )}
                      </tr>
                    </thead>
                    <tbody>
                      {gradacaoRows.map((row, idx) =>
                    <tr key={idx} className="border-b">
                          <td className="px-3 py-1.5 font-medium">{row.descricao}</td>
                          <td className="px-2 py-1.5 text-center font-mono">{row.aumentoCm}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.pp}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.p}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.m}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.g}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.gg}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.g1}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.g2}</td>
                          <td className="px-1 py-1.5 text-center font-mono">{row.g3}</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              }
            </CardContent>
          </Card>

          {/* Aviamentos do Modelo */}
          <Card>
            <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
              <h3 className="text-sm font-bold tracking-wide text-center">AVIAMENTOS DO MODELO</h3>
            </div>
            <CardContent className="p-3">
              {aviamentosExp.length === 0 ?
              <p className="text-sm text-muted-foreground text-center py-6">Busque uma ordem para ver os aviamentos.</p> :

              <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-1.5 text-left font-semibold">Descrição</th>
                        <th className="px-3 py-1.5 text-left font-semibold w-28">Tipo</th>
                        <th className="px-3 py-1.5 text-center font-semibold w-24">Qtd Modelo</th>
                        <th className="px-3 py-1.5 text-center font-semibold w-28">Qtd Envio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aviamentosExp.map((a) =>
                    <tr key={a.id} className="border-b">
                          <td className="px-3 py-1.5">{a.descricao}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{a.tipo}</td>
                          <td className="px-3 py-1.5 text-center">
                            <span className="bg-muted rounded px-2 py-0.5 font-mono">{a.qtdModelo}</span>
                          </td>
                          <td className="px-1.5 py-1">
                            <Input
                          type="number"
                          min="0"
                          value={a.qtdEnvio}
                          onChange={(e) => updateAviamentoEnvio(a.id, e.target.value)}
                          className={`h-7 text-xs text-center ${yellowInput}`}
                          placeholder="0" />
                        
                          </td>
                        </tr>
                    )}
                    </tbody>
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
                placeholder="Anotações sobre a expedição..." />
              
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);

};

export default ExpedicaoPage;