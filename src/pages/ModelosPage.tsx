import { useState, useRef, useCallback, useEffect } from "react";
import { PageLoading } from "@/components/shared/PageLoading";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from
"@/components/ui/alert-dialog";
import { useModelos, useClientes, useAviamentos } from "@/hooks/useSupabaseData";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { useEntityOptions } from "@/hooks/useEntityOptions";

// Tipos de modelo são carregados dinamicamente da tabela `tipos_modelo`

import { Plus, Save, Trash2, Printer, Search, Shirt, Upload, ClipboardCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { showSaving } from "@/lib/saving-toast";

// ── Types ──
interface AviamentoRow {
  tipo: string;
  selectedItem: any | null;
  partesQtde: string;
  isCustom?: boolean;
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
  const { modelos, loading: loadingModelos, salvarModelo, carregarModeloCompleto } = useModelos();
  const { clientes, loading: loadingClientes } = useClientes();
  const { aviamentos: dbAviamentos, loading: loadingAviamentos } = useAviamentos();
  const { tecidos: tecidoOptions, cores: corOptions } = useEntityOptions();
  const [cadastroModelosList, setCadastroModelosList] = useState<{ id: string; nome: string }[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tipos_modelo").select("id,nome").order("nome");
      if (data) setCadastroModelosList(data);
    })();
  }, []);
  const [referencia, setReferencia] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [tecido, setTecido] = useState("");
  const [modelo, setModelo] = useState("");
  const [cliente, setCliente] = useState("");
  const [statusKanban, setStatusKanban] = useState("");
  const [pilotoEntregue, setPilotoEntregue] = useState("");
  const [dataPedido, setDataPedido] = useState("");
  const [entretela, setEntretela] = useState(false);
  const [entretelaDescricao, setEntreTelaDescricao] = useState("");
  const [entreTelaQtde, setEntreTelaQtde] = useState("");
  const [entreTelaConsumoPeca, setEntreTelaConsumoPeca] = useState("");
  const [forroTecido2, setForroTecido2] = useState(false);
  const [forroDescricao, setForroDescricao] = useState("");
  const [forroQtde, setForroQtde] = useState("");
  const [forroConsumoPeca, setForroConsumoPeca] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [aviamentos, setAviamentos] = useState<AviamentoRow[]>(defaultAviamentos.map((a) => ({ ...a })));
  const [servicos, setServicos] = useState<ServicoRow[]>(defaultServicos.map((s) => ({ ...s })));
  const [consumoMetros, setConsumoMetros] = useState("");
  const [consumoGramas, setConsumoGramas] = useState("");
  const [gradacao, setGradacao] = useState<GradacaoRow[]>(Array.from({ length: 6 }, emptyGradacao));
  const emptyGradeTamanhos = () => ({ pp: "", p: "", m: "", g: "", gg: "", g1: "", g2: "", g3: "" });
  const [gradeTamanhos, setGradeTamanhos] = useState<Record<string, string>>(emptyGradeTamanhos());

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
  const [modelagemUrl, setModelagemUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [currentModeloId, setCurrentModeloId] = useState<string | null>(null);

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

  const loadModelo = async (m: any) => {
    setReferencia(m.referencia || "");
    setNumeroPedido("");
    setTecido(m.tecido_principal || "");
    setModelo(m.modelo || m.descricao || "");
    setCliente("");
    setPilotoEntregue("");
    setDataPedido("");
    setConsumoMetros(m.consumo_metros ? Number(m.consumo_metros).toFixed(2) : (m.consumo_tecido ? Number(m.consumo_tecido).toFixed(2) : ""));
    setConsumoGramas(m.consumo_gramas ? Number(m.consumo_gramas).toFixed(2) : "");
    setEntretela(!!m.entretela);
    setEntreTelaDescricao(m.entretela_descricao || "");
    setEntreTelaQtde(m.entretela_quantidade ? String(m.entretela_quantidade) : "");
    setEntreTelaConsumoPeca((m as any).entretela_consumo_peca ? String((m as any).entretela_consumo_peca) : "");
    setForroTecido2(!!m.forro_tecido2);
    setForroDescricao(m.forro_tecido2_descricao || "");
    setForroQtde(m.forro_tecido2_quantidade ? String(m.forro_tecido2_quantidade) : "");
    setForroConsumoPeca((m as any).forro_tecido2_consumo_peca ? String((m as any).forro_tecido2_consumo_peca) : "");
    setModelImage(m.imagem_url || null);
    setObservacoes(m.observacoes || "");
    try {
      const parsed = m.tamanhos_grade ? JSON.parse(m.tamanhos_grade) : null;
      setGradeTamanhos(parsed && typeof parsed === "object" ? { ...emptyGradeTamanhos(), ...parsed } : emptyGradeTamanhos());
    } catch {
      setGradeTamanhos(emptyGradeTamanhos());
    }
    setModelagemUrl(m.arquivo_modelagem_url || null);
    setModelagemFile(null);
    setCurrentModeloId(m.id);

    // Carrega filhos
    const { aviamentos: avs, servicos: svs, gradacao: grs } = await carregarModeloCompleto(m.id);
    if (avs.length) {
      const baseRows: AviamentoRow[] = defaultAviamentos.map((d, i) => {
        const r: any = avs[i];
        return r ? { tipo: d.tipo, selectedItem: r.descricao ? { descricao: r.descricao, tamanho: r.unidade } : null, partesQtde: r.quantidade ? String(r.quantidade) : "" } : { ...d };
      });
      const extras: AviamentoRow[] = avs.slice(defaultAviamentos.length).map((r: any) => {
        const desc: string = r.descricao || "";
        const sep = desc.includes(" — ") ? " — " : (desc.includes(" - ") ? " - " : null);
        const tipo = sep ? desc.split(sep)[0] : desc;
        const itemDesc = sep ? desc.split(sep).slice(1).join(sep) : "";
        return {
          tipo: tipo || "",
          selectedItem: itemDesc ? { descricao: itemDesc, tamanho: r.unidade } : null,
          partesQtde: r.quantidade ? String(r.quantidade) : "",
          isCustom: true,
        };
      });
      setAviamentos([...baseRows, ...extras]);
    } else {
      setAviamentos(defaultAviamentos.map((a) => ({ ...a })));
    }
    if (svs.length) {
      setServicos(svs.map((r: any) => ({ descricao: r.descricao || "", custoPorPeca: r.valor_unitario ? String(r.valor_unitario) : "" })));
    } else {
      setServicos(defaultServicos.map((s) => ({ ...s })));
    }
    if (grs.length) {
      setGradacao(grs.map((r: any) => ({ descricao: r.tamanho || "", aumentoCm: "", pp: "", p: r.medida_a ? String(r.medida_a) : "", m: "", g: "", gg: "", g1: "", g2: "", g3: "" })));
    } else {
      setGradacao(Array.from({ length: 6 }, emptyGradacao));
    }

    setSearchOpen(false);
    setIsLoadedFromSearch(true);
  };

  const limparCampos = () => {
    setReferencia("");setNumeroPedido("");setTecido("");setModelo("");setCliente("");setStatusKanban("");
    setPilotoEntregue("");setDataPedido("");
    setEntretela(false);setEntreTelaDescricao("");setEntreTelaQtde("");setEntreTelaConsumoPeca("");
    setForroTecido2(false);setForroDescricao("");setForroQtde("");setForroConsumoPeca("");
    setAviamentos(defaultAviamentos.map((a) => ({ ...a })));
    setServicos(defaultServicos.map((s) => ({ ...s })));
    setConsumoMetros("");setConsumoGramas("");
    setGradacao(Array.from({ length: 6 }, emptyGradacao));
    setGradeTamanhos(emptyGradeTamanhos());
    setObservacoes("");
    setModelagemFile(null);
    setModelagemUrl(null);
    setModelImage(null);
    setCurrentModeloId(null);
    setIsLoadedFromSearch(false);
  };

  // Gera número de pedido sequencial: PED-XXXXX (apenas calcula e exibe — a persistência ocorre em "Registrar Pedido")
  const handleGerarNumeroPedido = async () => {
    if (!referencia) {
      toast({ title: "Referência obrigatória", description: "Informe a referência antes de gerar o número do pedido.", variant: "destructive" });
      return;
    }
    const dataBase = dataPedido || new Date().toISOString().slice(0, 10);

    // Busca TODOS os PED-* e filtra apenas os estritamente numéricos (PED-#####),
    // ignorando importados como PED-OC-26577 que quebram a ordenação textual.
    const { data: existentes, error: errBusca } = await supabase
      .from("modelo_pedidos")
      .select("numero_pedido")
      .like("numero_pedido", "PED-%");

    if (errBusca) {
      toast({ title: "Erro ao gerar pedido", description: errBusca.message, variant: "destructive" });
      return;
    }

    let maior = 0;
    (existentes || []).forEach((r: any) => {
      const m = /^PED-(\d+)$/.exec(r.numero_pedido || "");
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > maior) maior = n;
      }
    });
    const numero = `PED-${String(maior + 1).padStart(5, "0")}`;
    setNumeroPedido(numero);
    if (!dataPedido) setDataPedido(dataBase);
    toast({ title: "Nº de Pedido gerado", description: `${numero} — clique em "Registrar Pedido" para persistir.` });
  };


  const allFieldsFilled = () => {
    return referencia && modelo && cliente && pilotoEntregue && dataPedido;
  };

  // ── File upload handler ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModelagemFile(file);
    const fileName = `modelagem/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("modelos").upload(fileName, file, { upsert: true });
    if (error) {
      toast({ title: "Erro ao enviar arquivo", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("modelos").getPublicUrl(fileName);
    setModelagemUrl(urlData.publicUrl);
    toast({ title: "Arquivo enviado", description: file.name });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = `imagens/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("modelos").upload(fileName, file, { upsert: true });
    if (error) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("modelos").getPublicUrl(fileName);
    setModelImage(urlData.publicUrl);
    toast({ title: "Imagem carregada", description: file.name });
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

  const updateAviamentoTipo = (idx: number, value: string) => {
    setAviamentos((prev) => prev.map((a, i) => i === idx ? { ...a, tipo: value, selectedItem: null } : a));
  };

  const addAviamentoExtra = () => {
    setAviamentos((prev) => [...prev, { tipo: "", selectedItem: null, partesQtde: "", isCustom: true }]);
  };

  const removeAviamentoExtra = (idx: number) => {
    setAviamentos((prev) => prev.filter((_, i) => i !== idx));
  };

  const tiposAviamentoDisponiveis = Array.from(
    new Set((dbAviamentos || []).map((a: any) => a.tipo).filter(Boolean))
  ).sort((a: string, b: string) => a.localeCompare(b, "pt-BR"));

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

  // ── Build payload ──
  const buildModeloPayload = () => ({
    referencia,
    descricao: modelo,
    modelo,
    tecido_principal: tecido || null,
    consumo_tecido: parseFloat(consumoMetros) || 0,
    consumo_metros: parseFloat(consumoMetros) || 0,
    consumo_gramas: parseFloat(consumoGramas) || 0,
    entretela,
    entretela_descricao: entretelaDescricao || null,
    entretela_quantidade: parseFloat(entreTelaQtde) || 0,
    entretela_consumo_peca: parseFloat(entreTelaConsumoPeca) || 0,
    forro_tecido2: forroTecido2,
    forro_tecido2_descricao: forroDescricao || null,
    forro_tecido2_quantidade: parseFloat(forroQtde) || 0,
    forro_tecido2_consumo_peca: parseFloat(forroConsumoPeca) || 0,
    arquivo_modelagem_url: modelagemUrl || null,
    status: statusKanban === "concluido" ? "ativo" : statusKanban === "pendente" ? "desenvolvimento" : "ativo",
    imagem_url: modelImage || null,
    observacoes: observacoes || null,
    tamanhos_grade: JSON.stringify(gradeTamanhos),
  });

  const buildChildren = () => ({
    aviamentos: aviamentos.map((a, i) => ({
      ordem: i + 1,
      descricao: a.selectedItem ? `${a.tipo} — ${a.selectedItem.descricao || ""}` : a.tipo,
      quantidade: parseFloat(a.partesQtde) || 0,
      unidade: a.selectedItem?.tamanho || null,
      observacao: null,
    })),
    servicos: servicos.map((s, i) => ({
      ordem: i + 1,
      descricao: s.descricao,
      valor_unitario: parseFloat(s.custoPorPeca) || 0,
      observacao: null,
    })),
    gradacao: gradacao.map((g, i) => ({
      ordem: i + 1,
      tamanho: g.descricao || null,
      medida_a: parseFloat(g.p) || 0,
      medida_b: parseFloat(g.m) || 0,
      medida_c: parseFloat(g.g) || 0,
      medida_d: parseFloat(g.gg) || 0,
      observacao: g.aumentoCm ? `Aumento: ${g.aumentoCm}cm` : null,
    })),
  });

  // ── Save / Clone ──
  const handleSaveClick = async () => {
    if (isLoadedFromSearch) {
      setSaveDialogOpen(true);
    } else {
      if (!allFieldsFilled()) {
        toast({ title: "Campos obrigatórios", description: "Preencha todos os campos editáveis antes de salvar.", variant: "destructive" });
        return;
      }
      // Se já existe um modelo com a mesma referência, pedir confirmação para sobrescrever
      const existingModel = modelos.find((m: any) => m.referencia === referencia);
      if (existingModel && !currentModeloId) {
        setSaveDialogOpen(true);
        return;
      }
      const dismissSaving = showSaving();
      let result;
      try {
        result = await salvarModelo(buildModeloPayload(), currentModeloId || undefined, buildChildren());
      } finally {
        dismissSaving();
      }
      if (result) {
        setCurrentModeloId(result);
        toast({ title: "Modelo salvo", description: `Referência ${referencia} salva com sucesso.` });
      }
    }
  };

  const handleSaveOverwriteStep1 = () => {
    setSaveDialogOpen(false);
    setSaveOverwriteDialogOpen(true);
  };

  const handleSaveOverwriteConfirm = async () => {
    setSaveOverwriteDialogOpen(false);
    const existingModel = modelos.find((m: any) => m.referencia === referencia);
    const dismissSaving = showSaving();
    let result;
    try {
      result = await salvarModelo(buildModeloPayload(), existingModel?.id || currentModeloId || undefined, buildChildren());
    } finally {
      dismissSaving();
    }
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

  // ── Registrar Pedido ──
  const handleRegistrarPedido = async () => {
    if (!numeroPedido) {
      toast({
        title: "Nº de Pedido obrigatório",
        description: "Gere o Nº de Pedido antes de registrar.",
        variant: "destructive",
      });
      return;
    }
    if (!referencia) {
      toast({ title: "Referência obrigatória", description: "Informe a referência do modelo.", variant: "destructive" });
      return;
    }
    const dataBase = dataPedido || new Date().toISOString().slice(0, 10);
    const dismissSaving = showSaving();
    let error: any;
    try {
      // Garante que não existe outro pedido com este número (evita sobrescrever)
      const { data: existente, error: errCheck } = await supabase
        .from("modelo_pedidos")
        .select("numero_pedido")
        .eq("numero_pedido", numeroPedido)
        .maybeSingle();
      if (errCheck) {
        error = errCheck;
      } else if (existente) {
        dismissSaving();
        toast({
          title: "Número de pedido já existe",
          description: `${numeroPedido} já está cadastrado. Clique em "Gerar Nº Pedido" novamente para obter um novo número.`,
          variant: "destructive",
        });
        return;
      } else {
        const res = await supabase.from("modelo_pedidos").insert({
          numero_pedido: numeroPedido,
          cliente: cliente || null,
          modelo_ref: referencia,
          data_pedido: dataBase,
          tecido: tecido || null,
          consumo_tecido: parseFloat(consumoMetros) || 0,
          status_kanban: statusKanban || "pendente",
          piloto_entregue: pilotoEntregue === "sim",
        } as any);
        error = res.error;
      }
    } finally {
      dismissSaving();
    }

    if (error) {
      toast({ title: "Erro ao registrar pedido", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pedido registrado", description: `Pedido ${numeroPedido} salvo com sucesso.` });
    // Limpa o número para forçar nova geração no próximo pedido (evita sobrescrita acidental)
    setNumeroPedido("");
  };


  const yellowInput = "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";

  const fichaContent =
  <div className="flex-1 space-y-4">
      {/* Header fields */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
            <div className="space-y-1 col-span-2">
              <Label className="text-xs font-semibold">Nº de Pedido</Label>
              <div className="flex gap-1">
                <Input value={numeroPedido} readOnly className={`flex-1 min-w-0 ${yellowInput} font-mono text-xs`} placeholder="REF-AAAAMMDD" />
                <Button variant="default" size="sm" className="h-10 shrink-0 px-3 text-xs whitespace-nowrap" onClick={handleGerarNumeroPedido}>
                  Gerar Nº Pedido
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tecido</Label>
              <SearchableSelect
                options={tecidoOptions}
                value={tecido || null}
                onChange={(v) => setTecido(v || "")}
                placeholder="Selecione tecido"
                searchPlaceholder="Buscar tecido..."
                className={yellowInput}
              />
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
              <select
                value={statusKanban}
                onChange={(e) => setStatusKanban(e.target.value)}
                className={`flex h-10 w-full items-center rounded-md border px-3 py-2 text-sm ${yellowInput}`}
              >
                <option value="">Selecionar</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="pendente">Pendente</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middle section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image column */}
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
                  {(modelagemFile || modelagemUrl) && (
                    <span className="text-xs text-foreground font-medium truncate max-w-[300px]">
                      {modelagemFile?.name || (modelagemUrl ? <a href={modelagemUrl} target="_blank" rel="noreferrer" className="underline text-primary">{modelagemUrl.split("/").pop()}</a> : "")}
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
                    <th className="text-center py-2 px-3 font-semibold w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {aviamentos.map((av, idx) => {
                  const filteredItems = dbAviamentos.filter((it: any) =>
                  it.tipo === av.tipo &&
                  ((it.descricao || "").toLowerCase().includes(aviamentoSearchTerm.toLowerCase()) ||
                  (it.tamanho || "").toLowerCase().includes(aviamentoSearchTerm.toLowerCase()))
                  );
                  const tipoVazio = !av.tipo;

                  return (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-1.5 px-3 font-medium text-xs">
                        {av.isCustom ? (
                          <Select value={av.tipo || undefined} onValueChange={(v) => updateAviamentoTipo(idx, v)}>
                            <SelectTrigger className={`h-7 text-xs ${yellowInput}`}>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {tiposAviamentoDisponiveis.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          av.tipo
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-xs">
                        {av.selectedItem ? (
                          <span className="truncate block max-w-[180px]">
                            {av.selectedItem.descricao}{av.selectedItem.tamanho ? ` - ${av.selectedItem.tamanho}` : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Nenhum</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <Sheet open={aviamentoSearchOpen === idx} onOpenChange={(open) => { setAviamentoSearchOpen(open ? idx : null); setAviamentoSearchTerm(""); }}>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={tipoVazio}>
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
                      <td className="py-1.5 px-2 text-center">
                        {av.isCustom && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeAviamentoExtra(idx)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                  <tr>
                    <td colSpan={5} className="py-2 px-3">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addAviamentoExtra}>
                        <Plus className="w-3 h-3" /> Adicionar Aviamento
                      </Button>
                    </td>
                  </tr>
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
                <div className="space-y-1 w-32">
                  <Label className="text-xs">Consumo p/ peça</Label>
                  <Input type="number" step="0.01" value={entreTelaConsumoPeca} onChange={(e) => setEntreTelaConsumoPeca(e.target.value)} className={yellowInput} placeholder="0" />
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
                <div className="space-y-1 w-32">
                  <Label className="text-xs">Consumo p/ peça</Label>
                  <Input type="number" step="0.01" value={forroConsumoPeca} onChange={(e) => setForroConsumoPeca(e.target.value)} className={yellowInput} placeholder="0" />
                </div>
              </>
          }
          </div>
        </CardContent>
      </Card>

      {/* Grade de Tamanhos */}
      <Card>
        <div className="bg-[hsl(199,89%,30%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
          <h3 className="text-sm font-bold tracking-wide text-center">GRADE DE TAMANHOS PEDIDO</h3>
        </div>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground mb-2">Informativo para a tela de Corte. Informe a quantidade de peças por tamanho.</p>
          <div className="grid grid-cols-9 gap-2">
            {(["pp","p","m","g","gg","g1","g2","g3"] as const).map((size) => (
              <div key={size} className="space-y-1">
                <Label className="text-xs text-center block uppercase">{size}</Label>
                <Input
                  type="number"
                  min="0"
                  value={gradeTamanhos[size]}
                  onChange={(e) => setGradeTamanhos((prev) => ({ ...prev, [size]: e.target.value }))}
                  className={`h-8 text-xs text-center ${yellowInput}`}
                  placeholder="0"
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs text-center block uppercase font-bold">Total</Label>
              <Input
                readOnly
                tabIndex={-1}
                value={(["pp","p","m","g","gg","g1","g2","g3"] as const).reduce((acc, s) => acc + (parseInt(gradeTamanhos[s]) || 0), 0)}
                className="h-8 text-xs text-center bg-muted/50 border-muted font-bold"
              />
            </div>
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

      {/* Observações */}
      <Card>
        <div className="bg-[hsl(220,14%,40%)] text-[hsl(0,0%,100%)] px-4 py-1.5 rounded-t-lg">
          <h3 className="text-sm font-bold tracking-wide text-center">OBSERVAÇÕES</h3>
        </div>
        <CardContent className="p-4">
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm min-h-[180px] resize-y ${yellowInput}`}
            placeholder="Anotações sobre o modelo..." />
        </CardContent>
      </Card>

    </div>;


  const isLoading = loadingModelos || loadingClientes || loadingAviamentos;
  if (isLoading) {
    return <PageLoading message="Carregando modelos..." />;
  }

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

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(217,71%,45%)] hover:bg-[hsl(217,71%,38%)] text-[hsl(0,0%,100%)]"
            onClick={handleRegistrarPedido}>
            <ClipboardCheck className="w-4 h-4" />
            <span>Registrar Pedido</span>
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