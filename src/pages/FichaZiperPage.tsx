import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Search, Trash2, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface ZiperCorRow {
  cor: string;
  codigo: string;
  qtdePecas: number;
  amostraCor: string;
}

interface ZiperOrdemData {
  ordemCorte: string;
  cliente: string;
  dataCorte: string;
  referencia: string;
  tecido: string;
  descricaoZiper: string;
  cores: ZiperCorRow[];
}

const mockZiperData: ZiperOrdemData[] = [
  {
    ordemCorte: "OC-0001", cliente: "Lojas Renner S.A.", dataCorte: "2025-02-20",
    referencia: "MK-2024-001", tecido: "Malha Cotton 30/1", descricaoZiper: "Invisível de 20 cm PTO",
    cores: [
      { cor: "Preto", codigo: "ZP-INV-20-PTO", qtdePecas: 300, amostraCor: "#000000" },
      { cor: "Marinho", codigo: "ZP-INV-20-MRN", qtdePecas: 200, amostraCor: "#001f4d" },
    ],
  },
  {
    ordemCorte: "OC-0002", cliente: "Riachuelo Modas Ltda", dataCorte: "2025-02-22",
    referencia: "MK-2024-002", tecido: "Piquet PA", descricaoZiper: "Comum de 15 cm COLOR",
    cores: [
      { cor: "Vermelho", codigo: "ZP-COM-15-VRM", qtdePecas: 300, amostraCor: "#cc0000" },
    ],
  },
  {
    ordemCorte: "OC-0003", cliente: "C&A Modas S.A.", dataCorte: "2025-02-25",
    referencia: "MK-2024-005", tecido: "Jeans Denim 10oz", descricaoZiper: "Destacável de 25 cm PTO/BR",
    cores: [
      { cor: "Preto/Branco", codigo: "ZP-DST-25-PB", qtdePecas: 120, amostraCor: "#000000" },
      { cor: "Azul Índigo", codigo: "ZP-DST-25-AZI", qtdePecas: 80, amostraCor: "#1a237e" },
    ],
  },
  {
    ordemCorte: "OC-0004", cliente: "Hering Store Ltda", dataCorte: "2025-02-28",
    referencia: "MK-2024-003", tecido: "Moletom Flanelado", descricaoZiper: "Invisível de 40 cm COLOR",
    cores: [
      { cor: "Cinza", codigo: "ZP-INV-40-CNZ", qtdePecas: 150, amostraCor: "#808080" },
    ],
  },
];

const FichaZiperPage = () => {
  const navigate = useNavigate();

  const [ordemCorte, setOrdemCorte] = useState("");
  const [cliente, setCliente] = useState("");
  const [dataCorte, setDataCorte] = useState("");
  const [referencia, setReferencia] = useState("");
  const [tecido, setTecido] = useState("");
  const [descricaoZiper, setDescricaoZiper] = useState("");
  const [cores, setCores] = useState<ZiperCorRow[]>([]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrdens = mockZiperData.filter(
    (oc) =>
      oc.ordemCorte.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oc.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oc.referencia.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadOrdem = (data: ZiperOrdemData) => {
    setOrdemCorte(data.ordemCorte);
    setCliente(data.cliente);
    setDataCorte(data.dataCorte);
    setReferencia(data.referencia);
    setTecido(data.tecido);
    setDescricaoZiper(data.descricaoZiper);
    setCores(data.cores);
    setSearchOpen(false);
    toast({ title: "Ordem carregada", description: `Dados do zíper da ${data.ordemCorte} carregados.` });
  };

  const limparCampos = () => {
    setOrdemCorte("");
    setCliente("");
    setDataCorte("");
    setReferencia("");
    setTecido("");
    setDescricaoZiper("");
    setCores([]);
  };

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const yellowInput =
    "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";

  const readOnlyInput =
    "bg-muted text-foreground border-border cursor-not-allowed";

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-[hsl(0,0%,100%)] hover:bg-[hsl(217,71%,35%)] shrink-0 print:hidden"
          onClick={() => navigate("/corte")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono flex-1 text-center pr-9">
          FICHA DE CORTE — ZÍPER
        </h1>
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
                  <Input
                    placeholder="Nº ordem, cliente ou ref..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {filteredOrdens.map((oc) => (
                    <button
                      key={oc.ordemCorte}
                      onClick={() => loadOrdem(oc)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm"
                    >
                      <div className="font-mono text-xs font-semibold text-primary">{oc.ordemCorte}</div>
                      <div className="text-muted-foreground text-xs">{oc.referencia} — {oc.tecido}</div>
                      <div className="text-muted-foreground text-[10px]">{oc.cliente}</div>
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
            variant="destructive"
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0"
            onClick={limparCampos}
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Pesquisa</span>
          </Button>

          <Separator className="hidden md:block" />

          <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </Button>
        </div>

        {/* Main Ficha Content */}
        <div className="flex-1 space-y-4">
          {/* Row 1: Ordem de Corte | Cliente | Data de Corte */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase">Ordem de Corte</Label>
                  <div className="flex gap-1">
                    <Input
                      value={ordemCorte}
                      onChange={(e) => setOrdemCorte(e.target.value)}
                      className={yellowInput}
                      placeholder="OC-0000"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const found = mockZiperData.find(
                            (d) => d.ordemCorte.toLowerCase() === ordemCorte.toLowerCase()
                          );
                          if (found) {
                            loadOrdem(found);
                          } else {
                            toast({ title: "Ordem não encontrada", description: `Nenhuma OC "${ordemCorte}" foi localizada.`, variant: "destructive" });
                          }
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => setSearchOpen(true)}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase">Cliente</Label>
                  <Input value={cliente} readOnly className={readOnlyInput} placeholder="-" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase">Data de Corte</Label>
                  <Input value={dataCorte} readOnly className={readOnlyInput} placeholder="-" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Row 2: Referência | Tecido | Descrição Zíper (highlighted) */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase">Referência</Label>
                  <Input value={referencia} readOnly className={readOnlyInput} placeholder="-" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase">Tecido</Label>
                  <Input value={tecido} readOnly className={readOnlyInput} placeholder="-" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase">Descrição Zíper</Label>
                  <Input value={descricaoZiper} readOnly className={readOnlyInput} placeholder="-" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repeating rows: COR (with swatch) | CÓD | QTDE PEÇAS */}
          {cores.length > 0 ? (
            cores.map((row, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 items-end">
                    {/* COR with color swatch */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase text-center block bg-muted py-1 rounded">COR</Label>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-16 h-16 border-2 border-border rounded shrink-0"
                          style={{ backgroundColor: row.amostraCor }}
                        />
                        <span className="text-sm font-medium">{row.cor || "-"}</span>
                      </div>
                    </div>
                    {/* CÓD */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase text-center block bg-muted py-1 rounded">CÓD</Label>
                      <div className="flex items-center h-16">
                        <span className="text-sm font-mono">{row.codigo || "-"}</span>
                      </div>
                    </div>
                    {/* QTDE PEÇAS */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase text-center block bg-muted py-1 rounded">QTDE PEÇAS</Label>
                      <div className="flex items-center h-16">
                        <span className="text-lg font-mono font-bold">{row.qtdePecas || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase text-center block bg-muted py-1 rounded">COR</Label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 border-2 border-border rounded shrink-0 bg-background" />
                      <span className="text-sm text-muted-foreground">-</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase text-center block bg-muted py-1 rounded">CÓD</Label>
                    <div className="flex items-center h-16">
                      <span className="text-sm text-muted-foreground">-</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase text-center block bg-muted py-1 rounded">QTDE PEÇAS</Label>
                    <div className="flex items-center h-16">
                      <span className="text-lg font-mono font-bold text-muted-foreground">0</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FichaZiperPage;
