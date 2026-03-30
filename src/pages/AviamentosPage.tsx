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
import { useAviamentos, useFornecedores } from "@/hooks/useSupabaseData";
import { Plus, Trash2, Search, Pencil, Package, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CATEGORIAS = ["Elásticos", "Zíper", "Regulador", "Botão", "Outros Aviamentos"];

const AviamentosPage = () => {
  const { aviamentos, loading, salvarAviamento, deletarAviamento } = useAviamentos();
  const { fornecedores } = useFornecedores();

  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [cor, setCor] = useState("");
  const [precoUnMt, setPrecoUnMt] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategoria, setSearchCategoria] = useState("todas");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const filteredAviamentos = aviamentos.filter((a: any) => {
    const matchSearch =
      (a.descricao || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.tamanho || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.cor || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = searchCategoria === "todas" || a.tipo === searchCategoria;
    return matchSearch && matchCat;
  });

  const loadAviamento = (a: any) => {
    setTipo(a.tipo || "");
    setDescricao(a.descricao || "");
    setTamanho(a.tamanho || "");
    setCor(a.cor || "");
    setPrecoUnMt(a.preco_un != null ? Number(a.preco_un).toFixed(3) : "");
    setFornecedorId(a.fornecedor_id || "");
    setEditingId(a.id);
    setSearchOpen(false);
  };

  const limparFicha = () => {
    setTipo(""); setDescricao(""); setTamanho(""); setCor(""); setPrecoUnMt(""); setFornecedorId(""); setEditingId(null);
  };

  const handleRegistrarClick = () => {
    if (!descricao.trim() || !tipo) {
      toast({ title: "Atenção", description: "Informe ao menos o tipo e a descrição.", variant: "destructive" });
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleConfirmRegistrar = async () => {
    setConfirmDialogOpen(false);
    const data: any = {
      tipo,
      descricao,
      tamanho: tamanho || null,
      cor: cor || null,
      preco_un: precoUnMt ? parseFloat(precoUnMt) : null,
      fornecedor_id: fornecedorId || null,
    };
    const result = await salvarAviamento(data, editingId || undefined);
    if (result) {
      toast({ title: editingId ? "Aviamento atualizado" : "Aviamento registrado", description: `"${descricao}" salvo com sucesso.` });
      limparFicha();
    }
  };

  const handleRemover = async (id: string) => {
    const ok = await deletarAviamento(id);
    if (ok) toast({ title: "Aviamento removido" });
  };

  const yellowInput = "bg-[hsl(48,100%,88%)] text-[hsl(220,15%,15%)] border-[hsl(48,80%,60%)] focus:ring-[hsl(48,80%,50%)] placeholder:text-[hsl(48,30%,50%)]";

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-[hsl(217,71%,25%)] text-[hsl(0,0%,100%)] rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono">AVIAMENTOS</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-row md:flex-col gap-2 md:gap-3 md:w-40 shrink-0 print:hidden overflow-x-auto pb-2 md:pb-0">
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0">
                <Search className="w-4 h-4" /><span>Buscar Aviamento</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader><SheetTitle>Buscar Aviamentos</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Descrição, tamanho ou cor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <Select value={searchCategoria} onValueChange={setSearchCategoria}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as categorias</SelectItem>
                    {CATEGORIAS.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
                <div className="space-y-1 max-h-[65vh] overflow-y-auto">
                  {filteredAviamentos.map((a: any) => (
                    <button key={a.id} onClick={() => loadAviamento(a)} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm">
                      <div className="font-mono text-xs font-semibold text-primary">{a.tipo}</div>
                      <div className="text-xs font-medium">{a.descricao}</div>
                      <div className="text-muted-foreground text-[11px]">{a.tamanho} — {a.cor} — R$ {Number(a.preco_un || 0).toFixed(3)}</div>
                    </button>
                  ))}
                  {filteredAviamentos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum aviamento encontrado</p>}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Separator className="hidden md:block" />

          <Button className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0 bg-[hsl(142,50%,35%)] hover:bg-[hsl(142,50%,30%)] text-[hsl(0,0%,100%)]" onClick={handleRegistrarClick}>
            <Plus className="w-4 h-4" /><span>{editingId ? "Atualizar" : "Novo"}</span>
          </Button>

          <Button variant="destructive" className="justify-start gap-2 text-xs h-auto py-2 whitespace-nowrap shrink-0" onClick={limparFicha}>
            <Trash2 className="w-4 h-4" /><span>Limpar Ficha</span>
          </Button>
        </div>

        <div className="flex-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tipo / Categoria</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger className={yellowInput}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs font-semibold">Descrição</Label>
                  <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} className={yellowInput} placeholder="Descrição do aviamento" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tamanho</Label>
                  <Input value={tamanho} onChange={(e) => setTamanho(e.target.value)} className={yellowInput} placeholder="Ex: 15mm, 20cm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Cor</Label>
                  <Input value={cor} onChange={(e) => setCor(e.target.value)} className={yellowInput} placeholder="Cor do aviamento" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Preço (UN/MT)</Label>
                  <Input value={precoUnMt} onChange={(e) => setPrecoUnMt(e.target.value)} className={yellowInput} placeholder="0.000" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs font-semibold">Fornecedor</Label>
                  <Select value={fornecedorId} onValueChange={setFornecedorId}>
                    <SelectTrigger className={yellowInput}><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum</SelectItem>
                      {fornecedores.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.razao_social}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h3 className="text-xs font-bold flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" />
                  Aviamentos Cadastrados ({aviamentos.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-2.5 px-3 font-semibold">Tipo</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Descrição</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Tamanho</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Cor</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Preço (UN/MT)</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Fornecedor</th>
                      <th className="text-center py-2.5 px-3 font-semibold w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Carregando...</td></tr>
                    ) : aviamentos.map((r: any) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 font-medium">{r.tipo}</td>
                        <td className="py-2 px-3">{r.descricao}</td>
                        <td className="py-2 px-3">{r.tamanho}</td>
                        <td className="py-2 px-3">{r.cor}</td>
                        <td className="py-2 px-3 text-right font-mono">R$ {Number(r.preco_un || 0).toFixed(3)}</td>
                        <td className="py-2 px-3">{r.fornecedores?.razao_social || "—"}</td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => loadAviamento(r)} title="Editar">
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleRemover(r.id)} title="Remover">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && aviamentos.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">Nenhum aviamento cadastrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{editingId ? "Atualizar aviamento?" : "Registrar aviamento?"}</AlertDialogTitle>
            <AlertDialogDescription>{editingId ? `Deseja atualizar "${descricao}"?` : `Deseja registrar "${descricao}"?`}</AlertDialogDescription>
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
