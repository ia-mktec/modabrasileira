import { useState, useRef } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { fornecedores as initialFornecedores, clientes as initialClientes } from "@/lib/mock-data";
import { Plus, Search, Pencil } from "lucide-react";

interface ModeloItem {
  id: string;
  nome: string;
}

interface CorItem {
  id: string;
  ref: string;
  cor: string;
  cod: string;
  hex: string;
}

const initialModelos: ModeloItem[] = [
  { id: "1", nome: "Calça" },
  { id: "2", nome: "Shorts" },
  { id: "3", nome: "Top" },
  { id: "4", nome: "Saia" },
  { id: "5", nome: "Vestido" },
  { id: "6", nome: "Macacão" },
  { id: "7", nome: "Macaquinho" },
  { id: "8", nome: "Blazer" },
  { id: "9", nome: "Colete" },
  { id: "10", nome: "Shorts-Saia" },
  { id: "11", nome: "Camisa" },
  { id: "12", nome: "Cropped" },
];

const initialCores: CorItem[] = [
  { id: "1", ref: "", cor: "Preto", cod: "001", hex: "#000000" },
  { id: "2", ref: "", cor: "Branco", cod: "002", hex: "#ffffff" },
  { id: "3", ref: "", cor: "Areia", cod: "003", hex: "#c2b280" },
  { id: "4", ref: "", cor: "Caqui", cod: "004", hex: "#c3b091" },
  { id: "5", ref: "", cor: "Terra", cod: "005", hex: "#8b4513" },
  { id: "6", ref: "", cor: "Verde", cod: "006", hex: "#228b22" },
  { id: "7", ref: "", cor: "Marrom", cod: "007", hex: "#654321" },
  { id: "8", ref: "", cor: "Azul", cod: "008", hex: "#0000cd" },
  { id: "9", ref: "", cor: "Nude", cod: "009", hex: "#f5cba7" },
  { id: "10", ref: "", cor: "Prata", cod: "023", hex: "#c0c0c0" },
  { id: "11", ref: "", cor: "Camelo", cod: "010", hex: "#c19a6b" },
  { id: "12", ref: "", cor: "Cinza", cod: "011", hex: "#808080" },
  { id: "13", ref: "", cor: "Mostarda", cod: "012", hex: "#ffdb58" },
  { id: "14", ref: "", cor: "Verde Claro", cod: "013", hex: "#90ee90" },
  { id: "15", ref: "", cor: "Caramelo", cod: "014", hex: "#af6e4d" },
  { id: "16", ref: "", cor: "Oliva", cod: "015", hex: "#808000" },
  { id: "17", ref: "", cor: "Off", cod: "016", hex: "#faf0e6" },
  { id: "18", ref: "", cor: "Roxo", cod: "017", hex: "#800080" },
  { id: "19", ref: "", cor: "Rosa", cod: "018", hex: "#ff69b4" },
  { id: "20", ref: "", cor: "Marinho", cod: "019", hex: "#001f4d" },
  { id: "21", ref: "", cor: "Turquesa", cod: "020", hex: "#40e0d0" },
  { id: "22", ref: "", cor: "Chumbo", cod: "021", hex: "#36454f" },
  { id: "23", ref: "", cor: "Cinza Claro", cod: "022", hex: "#d3d3d3" },
  { id: "24", ref: "", cor: "Capuccino", cod: "025", hex: "#a67b5b" },
];

const CadastroPage = () => {
  const [search, setSearch] = useState("");
  const [searchClientes, setSearchClientes] = useState("");
  const [modelos, setModelos] = useState<ModeloItem[]>(initialModelos);
  const [cores, setCores] = useState<CorItem[]>(initialCores);
  const [fornecedores, setFornecedores] = useState(initialFornecedores);
  const [clientes, setClientes] = useState(initialClientes);

  // Edit fornecedor
  const [editFornecedorOpen, setEditFornecedorOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<any>(null);

  // Edit cliente
  const [editClienteOpen, setEditClienteOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);

  // New cor with color picker
  const [novaCorOpen, setNovaCorOpen] = useState(false);
  const [novaCorNome, setNovaCorNome] = useState("");
  const [novaCorHex, setNovaCorHex] = useState("#ffffff");

  const filtered = fornecedores.filter(
    (f) =>
      f.razaoSocial.toLowerCase().includes(search.toLowerCase()) ||
      f.cnpj.includes(search)
  );

  const filteredClientes = clientes.filter(
    (c) =>
      c.razaoSocial.toLowerCase().includes(searchClientes.toLowerCase()) ||
      c.cnpj.includes(searchClientes)
  );

  const handleSaveFornecedor = () => {
    if (!editingFornecedor) return;
    setFornecedores(prev => prev.map(f => f.id === editingFornecedor.id ? editingFornecedor : f));
    setEditFornecedorOpen(false);
    setEditingFornecedor(null);
  };

  const handleSaveCliente = () => {
    if (!editingCliente) return;
    setClientes(prev => prev.map(c => c.id === editingCliente.id ? editingCliente : c));
    setEditClienteOpen(false);
    setEditingCliente(null);
  };

  const handleAddCor = () => {
    if (!novaCorNome.trim()) return;
    const maxCod = Math.max(...cores.map(c => parseInt(c.cod) || 0));
    const novoCod = String(maxCod + 1).padStart(3, "0");
    setCores(prev => [...prev, { id: `c-${Date.now()}`, ref: "", cor: novaCorNome.trim(), cod: novoCod, hex: novaCorHex }]);
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
                    {filtered.map((f) => (
                      <tr key={f.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium">{f.razaoSocial}</td>
                        <td className="py-3 px-4 font-mono text-xs">{f.cnpj}</td>
                        <td className="py-3 px-4">{f.contato}</td>
                        <td className="py-3 px-4 text-muted-foreground">{f.telefone}</td>
                        <td className="py-3 px-4">{f.cidade}/{f.uf}</td>
                        <td className="py-3 px-4 capitalize text-muted-foreground">{f.tipo}</td>
                        <td className="py-3 px-4 text-center">{f.prazoPagamento} dias</td>
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
                    {filteredClientes.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium">{c.razaoSocial}</td>
                        <td className="py-3 px-4 font-mono text-xs">{c.cnpj}</td>
                        <td className="py-3 px-4">{c.contato}</td>
                        <td className="py-3 px-4 text-muted-foreground">{c.telefone}</td>
                        <td className="py-3 px-4">{c.cidade}/{c.uf}</td>
                        <td className="py-3 px-4 text-center">{c.prazoRecebimento} dias</td>
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
                          <input
                            type="color"
                            value={c.hex}
                            onChange={(e) => setCores(prev => prev.map(item => item.id === c.id ? { ...item, hex: e.target.value } : item))}
                            className="w-8 h-8 cursor-pointer border border-border rounded"
                            title="Selecionar cor"
                          />
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
            <SheetTitle>Editar Fornecedor</SheetTitle>
            <SheetDescription>Altere os dados do fornecedor</SheetDescription>
          </SheetHeader>
          {editingFornecedor && (
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input value={editingFornecedor.razaoSocial} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, razaoSocial: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={editingFornecedor.cnpj} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, cnpj: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Contato</Label>
                <Input value={editingFornecedor.contato} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, contato: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editingFornecedor.telefone} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, telefone: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={editingFornecedor.cidade} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, cidade: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input value={editingFornecedor.uf} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, uf: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazo de Pagamento (dias)</Label>
                <Input type="number" value={editingFornecedor.prazoPagamento} onChange={(e) => setEditingFornecedor((prev: any) => ({ ...prev, prazoPagamento: parseInt(e.target.value) || 0 }))} />
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
            <SheetTitle>Editar Cliente</SheetTitle>
            <SheetDescription>Altere os dados do cliente</SheetDescription>
          </SheetHeader>
          {editingCliente && (
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input value={editingCliente.razaoSocial} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, razaoSocial: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={editingCliente.cnpj} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, cnpj: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Contato</Label>
                <Input value={editingCliente.contato} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, contato: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editingCliente.telefone} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, telefone: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={editingCliente.cidade} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, cidade: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input value={editingCliente.uf} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, uf: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazo de Recebimento (dias)</Label>
                <Input type="number" value={editingCliente.prazoRecebimento} onChange={(e) => setEditingCliente((prev: any) => ({ ...prev, prazoRecebimento: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={handleSaveCliente}>Salvar</Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditClienteOpen(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet: Nova Cor com seletor de cores */}
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
                <input
                  type="color"
                  value={novaCorHex}
                  onChange={(e) => setNovaCorHex(e.target.value)}
                  className="w-16 h-16 cursor-pointer border border-border rounded"
                />
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
