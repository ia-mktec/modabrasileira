import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { cadastroAviamentos, type AviamentoItem } from "@/lib/mock-data";
import { Plus, Trash2, Search, Pencil, Package, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AviamentoRegistro {
  id: string;
  item: string;
  descricao: string;
  tamanho: string;
  cor: string;
  precoUnMt: string;
  fornecedor: string;
}

const allAviamentos: AviamentoItem[] = cadastroAviamentos.flatMap((cat) =>
  cat.itens.map((it) => ({ ...it, categoria: cat.tipo }))
);

const AviamentosPage = () => {
  // Ficha fields
  const [item, setItem] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [cor, setCor] = useState("");
  const [precoUnMt, setPrecoUnMt] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search sheet
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategoria, setSearchCategoria] = useState("todas");

  // Registered items list
  const [registros, setRegistros] = useState<AviamentoRegistro[]>([]);

  // Confirm dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const categorias = cadastroAviamentos.map((c) => c.tipo);

  const filteredAviamentos = allAviamentos.filter((a) => {
    const matchSearch =
      a.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tamanho.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.cor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat =
      searchCategoria === "todas" ||
      cadastroAviamentos.find((c) => c.tipo === searchCategoria)?.itens.some((i) => i.id === a.id);
    return matchSearch && matchCat;
  });

  const loadAviamento = (a: AviamentoItem) => {
    setItem(a.id.toUpperCase());
    setDescricao(a.descricao);
    setTamanho(a.tamanho);
    setCor(a.cor);
    setPrecoUnMt(a.precoUn.toFixed(3));
    setFornecedor(a.fornecedor);
    setEditingId(null);
    setSearchOpen(false);
  };

  const loadRegistro = (r: AviamentoRegistro) => {
    setItem(r.item);
    setDescricao(r.descricao);
    setTamanho(r.tamanho);
    setCor(r.cor);
    setPrecoUnMt(r.precoUnMt);
    setFornecedor(r.fornecedor);
    setEditingId(r.id);
  };

  const limparFicha = () => {
    setItem("");
    setDescricao("");
    setTamanho("");
    setCor("");
    setPrecoUnMt("");
    setFornecedor("");
    setEditingId(null);
  };

  const handleRegistrarClick = () => {
    if (!descricao.trim()) {
      toast({ title: "Atenção", description: "Informe ao menos a descrição do aviamento.", variant: "destructive" });
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleConfirmRegistrar = () => {
    setConfirmDialogOpen(false);

    if (editingId) {
      setRegistros((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? { ...r, item, descricao, tamanho, cor, precoUnMt, fornecedor }
            : r
        )
      );
      toast({ title: "Aviamento atualizado", description: `"${descricao}" foi atualizado com sucesso.` });
    } else {
      const novo: AviamentoRegistro = {
        id: `av-reg-${Date.now()}`,
        item,
        descricao,
        tamanho,
        cor,
        precoUnMt,
        fornecedor,
      };
      setRegistros((prev) => [...prev, novo]);
      toast({ title: "Aviamento registrado", description: `"${descricao}" foi adicionado com sucesso.` });
    }
    limparFicha();
  };

  const handleRemoverRegistro = (id: string) => {
    setRegistros((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Registro removido" });
  };

  const yellowInput =
    "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">
          AVIAMENTOS
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Action Panel */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-3 md:w-40 shrink-0 print:hidden overflow-x-auto pb-2 md:pb-0">
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0">
                <Search className="w-4 h-4" />
                <span>Buscar Aviamento</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Buscar Aviamentos</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Descrição, tamanho ou cor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={searchCategoria} onValueChange={setSearchCategoria}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as categorias</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1 max-h-[65vh] overflow-y-auto">
                  {filteredAviamentos.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => loadAviamento(a)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                    >
                      <div className="font-mono text-xs font-semibold text-primary">
                        {a.id.toUpperCase()}
                      </div>
                      <div className="text-xs font-medium">{a.descricao}</div>
                      <div className="text-muted-foreground text-[11px]">
                        {a.tamanho} — {a.cor} — R$ {a.precoUn.toFixed(3)}
                      </div>
                    </button>
                  ))}
                  {filteredAviamentos.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum aviamento encontrado
                    </p>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Separator className="hidden md:block" />

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)]"
            onClick={handleRegistrarClick}
          >
            <Plus className="w-4 h-4" />
            <span>{editingId ? "Atualizar" : "Novo"}</span>
          </Button>

          <Button
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(217,71%,45%)] hover:bg-[hsl(217,71%,38%)] text-[hsl(0,0%,100%)]"
            onClick={() => {
              toast({ title: "Dados salvos", description: "Todas as alterações foram salvas com sucesso." });
            }}
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </Button>

          <Button
            variant="destructive"
            className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0"
            onClick={limparFicha}
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Ficha</span>
          </Button>
        </div>

        {/* Main Ficha Content */}
        <div className="flex-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Item</Label>
                  <Input
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    className={yellowInput}
                    placeholder="Código do item"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs font-semibold">Descrição</Label>
                  <Input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className={yellowInput}
                    placeholder="Descrição do aviamento"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tamanho</Label>
                  <Input
                    value={tamanho}
                    onChange={(e) => setTamanho(e.target.value)}
                    className={yellowInput}
                    placeholder="Ex: 15mm, 20cm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Cor</Label>
                  <Input
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className={yellowInput}
                    placeholder="Cor do aviamento"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Preço (UN/MT)</Label>
                  <Input
                    value={precoUnMt}
                    onChange={(e) => setPrecoUnMt(e.target.value)}
                    className={yellowInput}
                    placeholder="0.000"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs font-semibold">Fornecedor</Label>
                  <Input
                    value={fornecedor}
                    onChange={(e) => setFornecedor(e.target.value)}
                    className={yellowInput}
                    placeholder="Nome do fornecedor"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registered Items Table */}
          <Card>
            <CardContent className="p-0">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h3 className="text-xs font-bold flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" />
                  Aviamentos Cadastrados ({registros.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-2.5 px-3 font-semibold">Item</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Descrição</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Tamanho</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Cor</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Preço (UN/MT)</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Fornecedor</th>
                      <th className="text-center py-2.5 px-3 font-semibold w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 font-mono font-semibold text-primary">{r.item}</td>
                        <td className="py-2 px-3">{r.descricao}</td>
                        <td className="py-2 px-3">{r.tamanho}</td>
                        <td className="py-2 px-3">{r.cor}</td>
                        <td className="py-2 px-3 text-right font-mono">
                          R$ {r.precoUnMt}
                        </td>
                        <td className="py-2 px-3">{r.fornecedor || "—"}</td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => loadRegistro(r)}
                              title="Editar"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleRemoverRegistro(r.id)}
                              title="Remover"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {registros.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                          Nenhum aviamento cadastrado. Use "Buscar Aviamento" ou preencha os campos acima.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingId ? "Atualizar aviamento?" : "Registrar aviamento?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingId
                ? `Deseja atualizar o aviamento "${descricao}"?`
                : `Deseja registrar o aviamento "${descricao}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRegistrar}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AviamentosPage;
