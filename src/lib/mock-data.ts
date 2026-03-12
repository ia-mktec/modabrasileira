// Mock data for MKTEC Flow V1

export interface Tecido {
  id: string;
  nome: string;
  composicao: string;
  largura: number;
  peso: number;
  cor: string;
  cliente: string;
  estoqueKg: number;
  precoKg: number;
  status: "disponivel" | "baixo" | "indisponivel";
}

export interface Modelo {
  id: string;
  referencia: string;
  descricao: string;
  colecao: string;
  tecidoPrincipal: string;
  consumoTecido: number;
  tamanhosGrade: string;
  status: "ativo" | "inativo" | "desenvolvimento";
}

export interface OrdemCorte {
  id: string;
  numero: string;
  modeloRef: string;
  tecido: string;
  quantidadePecas: number;
  dataCorte: string;
  cortador: string;
  status: "pendente" | "em_andamento" | "concluido" | "cancelado";
  enfestos: number;
  perdaPercent: number;
}

export interface Fornecedor {
  id: string;
  razaoSocial: string;
  cnpj: string;
  contato: string;
  telefone: string;
  email: string;
  cidade: string;
  uf: string;
  tipo: "tecido" | "aviamento" | "servico";
  prazoPagamento: number;
  status: "ativo" | "inativo";
}

export interface Cliente {
  id: string;
  razaoSocial: string;
  cnpj: string;
  contato: string;
  telefone: string;
  cidade: string;
  uf: string;
  prazoRecebimento: number;
  status: "ativo" | "inativo";
}

export const clientes: Cliente[] = [
  { id: "1", razaoSocial: "Lojas Renner S.A.", cnpj: "92.754.738/0001-62", contato: "Carolina Mendes", telefone: "(51) 3456-7890", cidade: "Porto Alegre", uf: "RS", prazoRecebimento: 30, status: "ativo" },
  { id: "2", razaoSocial: "Riachuelo Modas Ltda", cnpj: "44.538.100/0001-06", contato: "Fernando Torres", telefone: "(84) 3214-5678", cidade: "Natal", uf: "RN", prazoRecebimento: 45, status: "ativo" },
  { id: "3", razaoSocial: "C&A Modas S.A.", cnpj: "45.242.914/0001-05", contato: "Juliana Ramos", telefone: "(11) 3876-5432", cidade: "São Paulo", uf: "SP", prazoRecebimento: 60, status: "ativo" },
  { id: "4", razaoSocial: "Marisa Lojas S.A.", cnpj: "49.658.737/0001-78", contato: "Ricardo Lopes", telefone: "(11) 2345-9876", cidade: "São Paulo", uf: "SP", prazoRecebimento: 30, status: "inativo" },
  { id: "5", razaoSocial: "Hering Store Ltda", cnpj: "26.418.013/0001-51", contato: "Patrícia Nunes", telefone: "(47) 3321-6543", cidade: "Blumenau", uf: "SC", prazoRecebimento: 28, status: "ativo" },
  { id: "6", razaoSocial: "Zara Brasil Ltda", cnpj: "07.228.420/0001-33", contato: "Marcos Silva", telefone: "(11) 4567-1234", cidade: "São Paulo", uf: "SP", prazoRecebimento: 45, status: "ativo" },
];

export const tecidos: Tecido[] = [
  { id: "1", nome: "Malha Cotton 30/1", composicao: "100% Algodão", largura: 1.60, peso: 160, cor: "Branco", cliente: "Lojas Renner S.A.", estoqueKg: 450, precoKg: 28.50, status: "disponivel" },
  { id: "2", nome: "Ribana 1x1", composicao: "95% Algodão 5% Elastano", largura: 0.90, peso: 220, cor: "Preto", cliente: "Lojas Renner S.A.", estoqueKg: 120, precoKg: 35.00, status: "disponivel" },
  { id: "3", nome: "Moletom Flanelado", composicao: "80% Algodão 20% Poliéster", largura: 1.80, peso: 320, cor: "Cinza Mescla", cliente: "Riachuelo Modas Ltda", estoqueKg: 30, precoKg: 42.00, status: "baixo" },
  { id: "4", nome: "Viscolycra", composicao: "96% Viscose 4% Elastano", largura: 1.50, peso: 180, cor: "Marinho", cliente: "C&A Modas S.A.", estoqueKg: 0, precoKg: 32.00, status: "indisponivel" },
  { id: "5", nome: "Piquet PA", composicao: "100% Poliamida", largura: 1.40, peso: 190, cor: "Vermelho", cliente: "Hering Store Ltda", estoqueKg: 280, precoKg: 38.00, status: "disponivel" },
  { id: "6", nome: "Jeans Denim 10oz", composicao: "100% Algodão", largura: 1.50, peso: 340, cor: "Azul Índigo", cliente: "Zara Brasil Ltda", estoqueKg: 600, precoKg: 55.00, status: "disponivel" },
];

export const modelos: Modelo[] = [
  { id: "1", referencia: "MK-2024-001", descricao: "Camiseta Básica Gola Redonda", colecao: "Verão 2025", tecidoPrincipal: "Malha Cotton 30/1", consumoTecido: 0.35, tamanhosGrade: "P/M/G/GG", status: "ativo" },
  { id: "2", referencia: "MK-2024-002", descricao: "Polo Masculina Manga Curta", colecao: "Verão 2025", tecidoPrincipal: "Piquet PA", consumoTecido: 0.45, tamanhosGrade: "P/M/G/GG/XG", status: "ativo" },
  { id: "3", referencia: "MK-2024-003", descricao: "Moletom Canguru Unissex", colecao: "Inverno 2025", tecidoPrincipal: "Moletom Flanelado", consumoTecido: 0.80, tamanhosGrade: "P/M/G/GG", status: "desenvolvimento" },
  { id: "4", referencia: "MK-2024-004", descricao: "Vestido Midi Transpassado", colecao: "Verão 2025", tecidoPrincipal: "Viscolycra", consumoTecido: 1.20, tamanhosGrade: "PP/P/M/G", status: "ativo" },
  { id: "5", referencia: "MK-2024-005", descricao: "Calça Jeans Skinny", colecao: "All Year", tecidoPrincipal: "Jeans Denim 10oz", consumoTecido: 1.40, tamanhosGrade: "36/38/40/42/44", status: "ativo" },
];

export const ordensCorte: OrdemCorte[] = [
  { id: "1", numero: "OC-0001", modeloRef: "MK-2024-001", tecido: "Malha Cotton 30/1", quantidadePecas: 500, dataCorte: "2025-02-20", cortador: "Carlos Silva", status: "concluido", enfestos: 12, perdaPercent: 3.2 },
  { id: "2", numero: "OC-0002", modeloRef: "MK-2024-002", tecido: "Piquet PA", quantidadePecas: 300, dataCorte: "2025-02-22", cortador: "José Santos", status: "em_andamento", enfestos: 8, perdaPercent: 0 },
  { id: "3", numero: "OC-0003", modeloRef: "MK-2024-005", tecido: "Jeans Denim 10oz", quantidadePecas: 200, dataCorte: "2025-02-25", cortador: "Carlos Silva", status: "pendente", enfestos: 0, perdaPercent: 0 },
  { id: "4", numero: "OC-0004", modeloRef: "MK-2024-003", tecido: "Moletom Flanelado", quantidadePecas: 150, dataCorte: "2025-02-28", cortador: "Ana Oliveira", status: "pendente", enfestos: 0, perdaPercent: 0 },
];

export const fornecedores: Fornecedor[] = [
  { id: "1", razaoSocial: "Têxtil Brasil Ltda", cnpj: "12.345.678/0001-90", contato: "Maria Souza", telefone: "(11) 3456-7890", email: "comercial@textilbrasil.com", cidade: "São Paulo", uf: "SP", tipo: "tecido", prazoPagamento: 30, status: "ativo" },
  { id: "2", razaoSocial: "Malhas SP Indústria", cnpj: "23.456.789/0001-01", contato: "Pedro Lima", telefone: "(11) 2345-6789", email: "vendas@malhassp.com", cidade: "Americana", uf: "SP", tipo: "tecido", prazoPagamento: 45, status: "ativo" },
  { id: "3", razaoSocial: "Fios & Cia Distribuidora", cnpj: "34.567.890/0001-12", contato: "Ana Costa", telefone: "(21) 3456-7890", email: "contato@fiosecia.com", cidade: "Rio de Janeiro", uf: "RJ", tipo: "aviamento", prazoPagamento: 28, status: "ativo" },
  { id: "4", razaoSocial: "PolyTech Sintéticos", cnpj: "45.678.901/0001-23", contato: "Roberto Alves", telefone: "(47) 3456-7890", email: "comercial@polytech.com", cidade: "Blumenau", uf: "SC", tipo: "tecido", prazoPagamento: 60, status: "ativo" },
  { id: "5", razaoSocial: "Denim House Brasil", cnpj: "56.789.012/0001-34", contato: "Fernanda Dias", telefone: "(11) 4567-8901", email: "vendas@denimhouse.com", cidade: "Jundiaí", uf: "SP", tipo: "tecido", prazoPagamento: 30, status: "inativo" },
];

export const dashboardKPIs = {
  producaoMes: 4850,
  producaoMeta: 6000,
  tecidoEstoque: 1480,
  ordensAbertas: 8,
  eficienciaCorte: 96.8,
  pecasExpedidas: 3200,
};

export const producaoSemanal = [
  { dia: "Seg", pecas: 180, meta: 200 },
  { dia: "Ter", pecas: 210, meta: 200 },
  { dia: "Qua", pecas: 195, meta: 200 },
  { dia: "Qui", pecas: 220, meta: 200 },
  { dia: "Sex", pecas: 205, meta: 200 },
];

export const statusProducao = [
  { name: "Corte", value: 35, fill: "hsl(217 71% 55%)" },
  { name: "Costura", value: 40, fill: "hsl(199 89% 48%)" },
  { name: "Acabamento", value: 15, fill: "hsl(142 71% 35%)" },
  { name: "Expedição", value: 10, fill: "hsl(38 92% 50%)" },
];

// Cadastro de Aviamentos por tipo
export interface AviamentoItem {
  id: string;
  descricao: string;
  tamanho: string;
  cor: string;
  precoUn: number;
  fornecedor: string;
}

export interface CadastroAviamentoTipo {
  tipo: string;
  itens: AviamentoItem[];
}

export const cadastroAviamentos: CadastroAviamentoTipo[] = [
  {
    tipo: "Elásticos",
    itens: [
      { id: "el-1", descricao: "Elástico 08mm", tamanho: "08mm", cor: "Preto/Branco", precoUn: 0.26, fornecedor: "" },
      { id: "el-2", descricao: "Elástico 10mm", tamanho: "10mm", cor: "Preto/Branco", precoUn: 0.28, fornecedor: "" },
      { id: "el-3", descricao: "Elástico 15mm", tamanho: "15mm", cor: "Preto/Branco", precoUn: 0.32, fornecedor: "" },
      { id: "el-4", descricao: "Elástico 20mm", tamanho: "20mm", cor: "Preto/Branco", precoUn: 0.34, fornecedor: "" },
      { id: "el-5", descricao: "Elástico 30mm", tamanho: "30mm", cor: "Preto/Branco", precoUn: 0.40, fornecedor: "" },
      { id: "el-6", descricao: "Elástico 40mm", tamanho: "40mm", cor: "Preto/Branco", precoUn: 0.43, fornecedor: "" },
      { id: "el-7", descricao: "Elástico 50mm", tamanho: "50mm", cor: "Preto/Branco", precoUn: 0.48, fornecedor: "" },
      { id: "el-8", descricao: "Elástico 60mm", tamanho: "60mm", cor: "Preto/Branco", precoUn: 0.52, fornecedor: "" },
      { id: "el-9", descricao: "Elástico 80mm", tamanho: "80mm", cor: "Colorido", precoUn: 0.80, fornecedor: "" },
    ],
  },
  {
    tipo: "Zíper",
    itens: [
      { id: "zp-1", descricao: "Comum de 15 cm PTO", tamanho: "15cm", cor: "Preto", precoUn: 0.156, fornecedor: "" },
      { id: "zp-2", descricao: "Comum de 15 cm COLOR", tamanho: "15cm", cor: "Colorido", precoUn: 0.22, fornecedor: "" },
      { id: "zp-3", descricao: "Comum de 18 cm PTO", tamanho: "18cm", cor: "Preto", precoUn: 0.20, fornecedor: "" },
      { id: "zp-4", descricao: "Comum de 18 cm COLOR", tamanho: "18cm", cor: "Colorido", precoUn: 0.269, fornecedor: "" },
      { id: "zp-5", descricao: "Comum de 20 cm PTO", tamanho: "20cm", cor: "Preto", precoUn: 0.209, fornecedor: "" },
      { id: "zp-6", descricao: "Comum de 20 cm COLOR", tamanho: "20cm", cor: "Colorido", precoUn: 0.277, fornecedor: "" },
      { id: "zp-7", descricao: "Invisível de 18 cm PTO", tamanho: "18cm", cor: "Preto", precoUn: 0.294, fornecedor: "" },
      { id: "zp-8", descricao: "Invisível de 18 cm COLOR", tamanho: "18cm", cor: "Colorido", precoUn: 0.38, fornecedor: "" },
      { id: "zp-9", descricao: "Invisível de 20 cm PTO", tamanho: "20cm", cor: "Preto", precoUn: 0.294, fornecedor: "" },
      { id: "zp-10", descricao: "Invisível de 20 cm COLOR", tamanho: "20cm", cor: "Colorido", precoUn: 0.385, fornecedor: "" },
      { id: "zp-11", descricao: "Invisível de 30 cm PTO", tamanho: "30cm", cor: "Preto", precoUn: 0.33, fornecedor: "" },
      { id: "zp-12", descricao: "Invisível de 30 cm COLOR", tamanho: "30cm", cor: "Colorido", precoUn: 0.445, fornecedor: "" },
      { id: "zp-13", descricao: "Invisível de 40 cm PTO", tamanho: "40cm", cor: "Preto", precoUn: 0.44, fornecedor: "" },
      { id: "zp-14", descricao: "Invisível de 40 cm COLOR", tamanho: "40cm", cor: "Colorido", precoUn: 0.50, fornecedor: "" },
      { id: "zp-15", descricao: "Invisível de 50 cm PTO", tamanho: "50cm", cor: "Preto", precoUn: 0.525, fornecedor: "" },
      { id: "zp-16", descricao: "Invisível de 50 cm COLOR", tamanho: "50cm", cor: "Colorido", precoUn: 0.579, fornecedor: "" },
      { id: "zp-17", descricao: "Invisível de 60 cm PTO", tamanho: "60cm", cor: "Preto", precoUn: 0.551, fornecedor: "" },
      { id: "zp-18", descricao: "Invisível de 60 cm COLOR", tamanho: "60cm", cor: "Colorido", precoUn: 0.708, fornecedor: "" },
      { id: "zp-19", descricao: "Destacável de 25 cm PTO/BR", tamanho: "25cm", cor: "Preto/Branco", precoUn: 0.622, fornecedor: "" },
      { id: "zp-20", descricao: "Destacável de 25 cm COR", tamanho: "25cm", cor: "Colorido", precoUn: 0.761, fornecedor: "" },
    ],
  },
  {
    tipo: "Regulador",
    itens: [
      { id: "rg-1", descricao: "Niquelado 10mm", tamanho: "10mm", cor: "Niquelado", precoUn: 0.08, fornecedor: "" },
      { id: "rg-2", descricao: "Niquelado 13mm", tamanho: "13mm", cor: "Niquelado", precoUn: 0.10, fornecedor: "" },
      { id: "rg-3", descricao: "Niquelado 20mm", tamanho: "20mm", cor: "Niquelado", precoUn: 0.15, fornecedor: "" },
      { id: "rg-4", descricao: "Preto 6mm", tamanho: "06mm", cor: "Niquelado", precoUn: 0.08, fornecedor: "" },
      { id: "rg-5", descricao: "Preto 8mm", tamanho: "08mm", cor: "Niquelado", precoUn: 0.09, fornecedor: "" },
      { id: "rg-6", descricao: "Preto 10mm", tamanho: "10mm", cor: "Niquelado", precoUn: 0.15, fornecedor: "" },
    ],
  },
  {
    tipo: "Botão",
    itens: [
      { id: "bt-1", descricao: "Tingido 15", tamanho: "06mm", cor: "Diversos", precoUn: 0.06, fornecedor: "" },
      { id: "bt-2", descricao: "Tingido 18", tamanho: "08mm", cor: "Diversos", precoUn: 0.08, fornecedor: "" },
      { id: "bt-3", descricao: "Tingido 20", tamanho: "10mm", cor: "Diversos", precoUn: 0.10, fornecedor: "" },
      { id: "bt-4", descricao: "Forrado TAM 16", tamanho: "06mm", cor: "Diversos", precoUn: 0.08, fornecedor: "" },
      { id: "bt-5", descricao: "Forrado TAM 18", tamanho: "08mm", cor: "Diversos", precoUn: 0.09, fornecedor: "" },
      { id: "bt-6", descricao: "Forrado TAM 32", tamanho: "25mm", cor: "Diversos", precoUn: 0.25, fornecedor: "" },
      { id: "bt-7", descricao: "Tingido 32", tamanho: "25mm", cor: "Diversos", precoUn: 0.40, fornecedor: "" },
      { id: "bt-8", descricao: "Tingido 34", tamanho: "30mm", cor: "Diversos", precoUn: 0.45, fornecedor: "" },
    ],
  },
  {
    tipo: "Outros Aviamentos",
    itens: [
      { id: "ot-1", descricao: "Fivela Niquelada 50mm", tamanho: "50mm", cor: "Niquelado", precoUn: 5.00, fornecedor: "" },
      { id: "ot-2", descricao: "Fivela 1/2 Niquelada 45mm", tamanho: "45mm", cor: "Niquelado", precoUn: 5.00, fornecedor: "" },
    ],
  },
];
