import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useFornecedores, useClientes } from "@/hooks/useSupabaseData";
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Local lookup data (not persisted to DB - simple dropdown options)
const initialModelos = [
  { id: "1", nome: "Calça" }, { id: "2", nome: "Shorts" }, { id: "3", nome: "Top" },
  { id: "4", nome: "Saia" }, { id: "5", nome: "Vestido" }, { id: "6", nome: "Macacão" },
  { id: "7", nome: "Macaquinho" }, { id: "8", nome: "Blazer" }, { id: "9", nome: "Colete" },
  { id: "10", nome: "Shorts-Saia" }, { id: "11", nome: "Camisa" }, { id: "12", nome: "Cropped" },
];

const initialCores = [
  { id: "1", cor: "Abacate", cod: "001", hex: "#7a9a3b" },
  { id: "2", cor: "Abóbora", cod: "002", hex: "#e67e22" },
  { id: "3", cor: "Amarelo", cod: "003", hex: "#ffeb3b" },
  { id: "4", cor: "Areia", cod: "004", hex: "#c2b280" },
  { id: "5", cor: "Azul", cod: "005", hex: "#0000cd" },
  { id: "6", cor: "Azul bebê", cod: "006", hex: "#a7c7e7" },
  { id: "7", cor: "Azul céu", cod: "007", hex: "#87ceeb" },
  { id: "8", cor: "Azul claro", cod: "008", hex: "#5dade2" },
  { id: "9", cor: "Azul escuro", cod: "009", hex: "#1a237e" },
  { id: "10", cor: "Azul jeans", cod: "010", hex: "#5e7e9a" },
  { id: "11", cor: "Azul pastel", cod: "011", hex: "#aec6cf" },
  { id: "12", cor: "Bege", cod: "012", hex: "#e8d3b0" },
  { id: "13", cor: "Bege escuro", cod: "013", hex: "#a98765" },
  { id: "14", cor: "Bordô", cod: "014", hex: "#7b1c30" },
  { id: "15", cor: "Branco", cod: "015", hex: "#ffffff" },
  { id: "16", cor: "Café", cod: "016", hex: "#4b2e1e" },
  { id: "17", cor: "Cappuccino", cod: "017", hex: "#a67b5b" },
  { id: "18", cor: "Caqui", cod: "018", hex: "#c3b091" },
  { id: "19", cor: "Caramelo", cod: "019", hex: "#af6e4d" },
  { id: "20", cor: "Chocolate", cod: "020", hex: "#5d3a1a" },
  { id: "21", cor: "Chumbo", cod: "021", hex: "#36454f" },
  { id: "22", cor: "Cinza", cod: "022", hex: "#808080" },
  { id: "23", cor: "Cinza claro", cod: "023", hex: "#d3d3d3" },
  { id: "24", cor: "Cobre", cod: "024", hex: "#b87333" },
  { id: "25", cor: "Creme", cod: "025", hex: "#fffdd0" },
  { id: "26", cor: "Fúcsia", cod: "026", hex: "#ff00ff" },
  { id: "27", cor: "Gelo", cod: "027", hex: "#f0f8ff" },
  { id: "28", cor: "Goiaba", cod: "028", hex: "#f08080" },
  { id: "29", cor: "Laranja", cod: "029", hex: "#ff7f00" },
  { id: "30", cor: "Lilás", cod: "030", hex: "#c8a2c8" },
  { id: "31", cor: "Limão", cod: "031", hex: "#bfff00" },
  { id: "32", cor: "Marinho", cod: "032", hex: "#001f4d" },
  { id: "33", cor: "Marrom", cod: "033", hex: "#654321" },
  { id: "34", cor: "Mostarda", cod: "034", hex: "#ffdb58" },
  { id: "35", cor: "Musgo", cod: "035", hex: "#5a6e3a" },
  { id: "36", cor: "Natural", cod: "036", hex: "#f5e9c8" },
  { id: "37", cor: "Nude", cod: "037", hex: "#f5cba7" },
  { id: "38", cor: "Ocre", cod: "038", hex: "#cc7722" },
  { id: "39", cor: "Off", cod: "039", hex: "#faf0e6" },
  { id: "40", cor: "Oliva", cod: "040", hex: "#808000" },
  { id: "41", cor: "Palha", cod: "041", hex: "#e8d8a0" },
  { id: "42", cor: "Pele", cod: "042", hex: "#f1c27d" },
  { id: "43", cor: "Petróleo", cod: "043", hex: "#1a4a5a" },
  { id: "44", cor: "Pink", cod: "044", hex: "#ff1493" },
  { id: "45", cor: "Prata", cod: "045", hex: "#c0c0c0" },
  { id: "46", cor: "Preto", cod: "046", hex: "#000000" },
  { id: "47", cor: "Rosa", cod: "047", hex: "#ff69b4" },
  { id: "48", cor: "Roxo", cod: "048", hex: "#800080" },
  { id: "49", cor: "Salmão", cod: "049", hex: "#fa8072" },
  { id: "50", cor: "Taupe", cod: "050", hex: "#8b7d6b" },
  { id: "51", cor: "Terra", cod: "051", hex: "#8b4513" },
  { id: "52", cor: "Toffee", cod: "052", hex: "#8b5a2b" },
  { id: "53", cor: "Turquesa", cod: "053", hex: "#40e0d0" },
  { id: "54", cor: "Verde", cod: "054", hex: "#228b22" },
  { id: "55", cor: "Verde água", cod: "055", hex: "#a8e6cf" },
  { id: "56", cor: "Verde claro", cod: "056", hex: "#90ee90" },
  { id: "57", cor: "Verde-mar", cod: "057", hex: "#2e8b57" },
  { id: "58", cor: "Vermelho", cod: "058", hex: "#dc143c" },
  { id: "59", cor: "Vinho", cod: "059", hex: "#722f37" },
];

const CadastroPage = () => {
  const { fornecedores, loading: loadingForn, salvarFornecedor } = useFornecedores();
  const { clientes, loading: loadingCli, salvarCliente } = useClientes();

  const [search, setSearch] = useState("");
  const [searchClientes, setSearchClientes] = useState("");
  const [modelos, setModelos] = useState(initialModelos);
  const [cores, setCores] = useState(initialCores);

  const [editFornecedorOpen, setEditFornecedorOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<any>(null);
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
    await salvarFornecedor(data, id);
    setEditFornecedorOpen(false);
    setEditingFornecedor(null);
    toast({ title: "Fornecedor salvo com sucesso" });
  };

  const handleSaveCliente = async () => {
    if (!editingCliente) return;
    const { id, created_at, updated_at, ...data } = editingCliente;
    await salvarCliente(data, id);
    setEditClienteOpen(false);
    setEditingCliente(null);
    toast({ title: "Cliente salvo com sucesso" });
  };

  const handleAddCor = () => {
    if (!novaCorNome.trim()) return;
    const maxCod = Math.max(...cores.map(c => parseInt(c.cod) || 0));
    const novoCod = String(maxCod + 1).padStart(3, "0");
    setCores(prev => [...prev, { id: `c-${Date.now()}`, cor: novaCorNome.trim(), cod: novoCod, hex: novaCorHex }]);
    setNovaCorNome("");
    setNovaCorHex("#ffffff");
    setNovaCorOpen(false);
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
                      <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Carregando...</td></tr>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingFornecedor({ ...f });
                            setEditFornecedorOpen(true);
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
                      <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Carregando...</td></tr>
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
            <Button size="sm" onClick={() => {
              const nome = prompt("Nome do novo modelo:");
              if (nome?.trim()) {
                setModelos(prev => [...prev, { id: `m-${Date.now()}`, nome: nome.trim() }]);
              }
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
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            const novoNome = prompt("Editar nome:", m.nome);
                            if (novoNome?.trim()) {
                              setModelos(prev => prev.map(item => item.id === m.id ? { ...item, nome: novoNome.trim() } : item));
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
                          <input type="color" value={c.hex} onChange={(e) => setCores(prev => prev.map(item => item.id === c.id ? { ...item, hex: e.target.value } : item))} className="w-8 h-8 cursor-pointer border border-border rounded" />
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
    </div>
  );
};

export default CadastroPage;
