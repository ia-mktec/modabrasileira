import { useState, useEffect } from "react";
import { PageLoading } from "@/components/shared/PageLoading";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useFornecedores, useClientes } from "@/hooks/useSupabaseData";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { showSaving } from "@/lib/saving-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

// Local lookup data (not persisted to DB - simple dropdown options)

import { useCadastroCores } from "@/hooks/useCadastroCores";

const CadastroPage = () => {
  const { fornecedores, loading: loadingForn, salvarFornecedor, deletarFornecedor } = useFornecedores();
  const { clientes, loading: loadingCli, salvarCliente } = useClientes();
  const { cores, addCor, updateCor } = useCadastroCores();

  const [search, setSearch] = useState("");
  const [searchClientes, setSearchClientes] = useState("");
  const [modelos, setModelos] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tipos_modelo").select("id,nome").order("nome");
      if (data) setModelos(data);
    })();
  }, []);

  const [editFornecedorOpen, setEditFornecedorOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<any>(null);
  const [deleteFornecedorOpen, setDeleteFornecedorOpen] = useState(false);
  const [deletingFornecedor, setDeletingFornecedor] = useState<any>(null);
  const [editClienteOpen, setEditClienteOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [novaCorOpen, setNovaCorOpen] = useState(false);
  const [novaCorNome, setNovaCorNome] = useState("");
  const [novaCorHex, setNovaCorHex] = useState("#ffffff");

  const filtered = fornecedores.filter(
    (f: any) =>
      (f.razao_social || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.cnpj || "").includes(search)
  );

  const filteredClientes = clientes.filter(
    (c: any) =>
      (c.razao_social || "").toLowerCase().includes(searchClientes.toLowerCase()) ||
      (c.cnpj || "").includes(searchClientes)
  );

  const handleSaveFornecedor = async () => {
    if (!editingFornecedor) return;
    const { id, created_at, updated_at, ...data } = editingFornecedor;
    const dismissSaving = showSaving();
    try {
      await salvarFornecedor(data, id);
    } finally {
      dismissSaving();
    }
    setEditFornecedorOpen(false);
    setEditingFornecedor(null);
    toast({ title: "Fornecedor salvo com sucesso" });
  };

  const handleSaveCliente = async () => {
    if (!editingCliente) return;
    const { id, created_at, updated_at, ...data } = editingCliente;
    const dismissSaving = showSaving();
    try {
      await salvarCliente(data, id);
    } finally {
      dismissSaving();
    }
    setEditClienteOpen(false);
    setEditingCliente(null);
    toast({ title: "Cliente salvo com sucesso" });
  };

  const handleAddCor = async () => {
    if (!novaCorNome.trim()) return;
    try {
      await addCor(novaCorNome.trim(), novaCorHex);
      toast({ title: "Cor cadastrada com sucesso" });
    } catch (e: any) {
      toast({ title: "Erro ao cadastrar cor", description: e.message, variant: "destructive" });
      return;
    }
    setNovaCorNome("");
    setNovaCorHex("#ffffff");
    setNovaCorOpen(false);
  };

  const handleDeleteFornecedor = async () => {
    if (!deletingFornecedor) return;
    // Verifica vínculos na tabela aviamentos
    const { data: vinculos, error } = await supabase
      .from("aviamentos")
      .select("id")
      .eq("fornecedor_id", deletingFornecedor.id)
      .limit(1);
    if (error) {
      toast({ title: "Erro ao verificar vínculos", description: error.message, variant: "destructive" });
      setDeleteFornecedorOpen(false);
      return;
    }
    if (vinculos && vinculos.length > 0) {
      toast({ title: "Não é possível excluir", description: "Este fornecedor possui aviamentos vinculados.", variant: "destructive" });
      setDeleteFornecedorOpen(false);
      return;
    }
    const ok = await deletarFornecedor(deletingFornecedor.id);
    if (ok) {
      toast({ title: "Fornecedor excluído com sucesso" });
    }
    setDeleteFornecedorOpen(false);
    setDeletingFornecedor(null);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Cadastro" description="Fornecedores, clientes, modelos e cores" />

      <Tabs defaultValue="fornecedores">
        <TabsList>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="modelos">Modelo</TabsTrigger>
          <TabsTrigger value="cores">Cores</TabsTrigger>
        </TabsList>

        {/* Fornecedores Tab */}
        <TabsContent value="fornecedores" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button size="sm" onClick={() => {
              setEditingFornecedor({ razao_social: "", cnpj: "", contato: "", telefone: "", email: "", cidade: "", uf: "", tipo: "tecido", prazo_pagamento: 30, status: "ativo" });
              setEditFornecedorOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-1" /> Novo Fornecedor
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Razão Social</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">CNPJ</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contato</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Telefone</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cidade/UF</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Prazo Pgto</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingForn ? (
                      <tr><td colSpan={9}><PageLoading fullPage={false} /></td></tr>
                    ) : filtered.map((f: any) => (
                      <tr key={f.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium">{f.razao_social}</td>
                        <td className="py-3 px-4 font-mono text-xs">{f.cnpj}</td>
                        <td className="py-3 px-4">{f.contato}</td>
                        <td className="py-3 px-4 text-muted-foreground">{f.telefone}</td>
                        <td className="py-3 px-4">{f.cidade}/{f.uf}</td>
                        <td className="py-3 px-4 capitalize text-muted-foreground">{f.tipo}</td>
                        <td className="py-3 px-4 text-center">{f.prazo_pagamento} dias</td>
                        <td className="py-3 px-4"><StatusBadge status={f.status} /></td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setEditingFornecedor({ ...f });
                              setEditFornecedorOpen(true);
                            }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => {
                              setDeletingFornecedor(f);
                              setDeleteFornecedorOpen(true);
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clientes Tab */}
        <TabsContent value="clientes" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente..." value={searchClientes} onChange={(e) => setSearchClientes(e.target.value)} className="pl-9" />
            </div>
            <Button size="sm" onClick={() => {
              setEditingCliente({ razao_social: "", cnpj: "", contato: "", telefone: "", cidade: "", uf: "", prazo_recebimento: 30, status: "ativo" });
              setEditClienteOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-1" /> Novo Cliente
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Razão Social</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">CNPJ</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contato</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Telefone</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cidade/UF</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Prazo Receb.</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCli ? (
                      <tr><td colSpan={8}><PageLoading fullPage={false} /></td></tr>
                    ) : filteredClientes.map((c: any) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium">{c.razao_social}</td>
                        <td className="py-3 px-4 font-mono text-xs">{c.cnpj}</td>
                        <td className="py-3 px-4">{c.contato}</td>
                        <td className="py-3 px-4 text-muted-foreground">{c.telefone}</td>
                        <td className="py-3 px-4">{c.cidade}/{c.uf}</td>
                        <td className="py-3 px-4 text-center">{c.prazo_recebimento} dias</td>
                        <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingCliente({ ...c });
                            setEditClienteOpen(true);
                          }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modelo Tab */}
        <TabsContent value="modelos" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Tipos de modelo disponíveis para a tela de Modelos</p>
            <Button size="sm" onClick={async () => {
              const nome = prompt("Nome do novo modelo:");
              if (!nome?.trim()) return;
              const { data, error } = await supabase.from("tipos_modelo").insert({ nome: nome.trim() }).select("id,nome").single();
              if (error) {
                toast({ title: "Erro ao salvar modelo", description: error.message, variant: "destructive" });
                return;
              }
              setModelos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
              toast({ title: "Modelo salvo com sucesso" });
            }}>
              <Plus className="w-4 h-4 mr-1" /> Novo Cadastro
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground w-16">#</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome do Modelo</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelos.map((m, idx) => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium">{m.nome}</td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => {
                            const novoNome = prompt("Editar nome:", m.nome);
                            if (!novoNome?.trim()) return;
                            const { error } = await supabase.from("tipos_modelo").update({ nome: novoNome.trim() }).eq("id", m.id);
                            if (error) {
                              toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
                              return;
                            }
                            setModelos(prev => prev.map(item => item.id === m.id ? { ...item, nome: novoNome.trim() } : item));
                            toast({ title: "Modelo atualizado" });
                          }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cores Tab */}
        <TabsContent value="cores" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Cores disponíveis para a tela de Tecidos</p>
            <Button size="sm" onClick={() => setNovaCorOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Novo Cadastro
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground w-16">Amostra</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cor</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground w-20">Cód</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cores.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 text-center">
                          <input type="color" value={c.hex} onChange={(e) => updateCor(c.id, { hex: e.target.value })} className="w-8 h-8 cursor-pointer border border-border rounded" />
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-border shrink-0" style={{ backgroundColor: c.hex }} />
                            {c.cor}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">{c.cod}</td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            const novaCor = prompt("Editar cor:", c.cor);
                            if (novaCor?.trim()) {
                              setCores(prev => prev.map(item => item.id === c.id ? { ...item, cor: novaCor.trim() } : item));
                            }
                          }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sheet: Editar Fornecedor */}
      <Sheet open={editFornecedorOpen} onOpenChange={setEditFornecedorOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingFornecedor?.id ? "Editar" : "Novo"} Fornecedor</SheetTitle>
            <SheetDescription>Preencha os dados do fornecedor</SheetDescription>
          </SheetHeader>
          {editingFornecedor && (
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input value={editingFornecedor.razao_social || ""} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, razao_social: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={editingFornecedor.cnpj || ""} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, cnpj: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Contato</Label>
                <Input value={editingFornecedor.contato || ""} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, contato: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editingFornecedor.telefone || ""} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, telefone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editingFornecedor.email || ""} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={editingFornecedor.cidade || ""} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, cidade: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input value={editingFornecedor.uf || ""} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, uf: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazo de Pagamento (dias)</Label>
                <Input type="number" value={editingFornecedor.prazo_pagamento || 0} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, prazo_pagamento: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editingFornecedor.status || "ativo"} onValueChange={(val) => setEditingFornecedor((prev: any) => ({ ...prev, status: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={handleSaveFornecedor}>Salvar</Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditFornecedorOpen(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet: Editar Cliente */}
      <Sheet open={editClienteOpen} onOpenChange={setEditClienteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingCliente?.id ? "Editar" : "Novo"} Cliente</SheetTitle>
            <SheetDescription>Preencha os dados do cliente</SheetDescription>
          </SheetHeader>
          {editingCliente && (
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input value={editingCliente.razao_social || ""} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, razao_social: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={editingCliente.cnpj || ""} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, cnpj: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Contato</Label>
                <Input value={editingCliente.contato || ""} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, contato: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editingCliente.telefone || ""} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, telefone: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={editingCliente.cidade || ""} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, cidade: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input value={editingCliente.uf || ""} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, uf: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazo de Recebimento (dias)</Label>
                <Input type="number" value={editingCliente.prazo_recebimento || 0} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, prazo_recebimento: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={handleSaveCliente}>Salvar</Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditClienteOpen(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet: Nova Cor */}
      <Sheet open={novaCorOpen} onOpenChange={setNovaCorOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Nova Cor</SheetTitle>
            <SheetDescription>Adicione uma nova cor ao cadastro</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label>Nome da Cor</Label>
              <Input placeholder="Ex: Vermelho" value={novaCorNome} onChange={(e) => setNovaCorNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Selecione a Cor</Label>
              <div className="flex items-center gap-4">
                <input type="color" value={novaCorHex} onChange={(e) => setNovaCorHex(e.target.value)} className="w-16 h-16 cursor-pointer border border-border rounded" />
                <div className="space-y-1">
                  <div className="w-12 h-12 rounded-lg border border-border" style={{ backgroundColor: novaCorHex }} />
                  <span className="text-xs font-mono text-muted-foreground">{novaCorHex}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={handleAddCor} disabled={!novaCorNome.trim()}>Adicionar</Button>
              <Button variant="outline" className="flex-1" onClick={() => setNovaCorOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* AlertDialog: Confirmar exclusão de Fornecedor */}
      <AlertDialog open={deleteFornecedorOpen} onOpenChange={setDeleteFornecedorOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor <strong>{deletingFornecedor?.razao_social}</strong>?
              <br />
              {deletingFornecedor?.id && "Se houver aviamentos vinculados, a exclusão será bloqueada automaticamente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingFornecedor(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFornecedor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CadastroPage;
