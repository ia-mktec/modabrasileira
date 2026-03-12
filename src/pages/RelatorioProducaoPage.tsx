import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientes } from "@/lib/mock-data";
import { CalendarDays } from "lucide-react";
import { ConsultaProdutoDialog } from "@/components/shared/ConsultaProdutoDialog";
import produtoPolo from "@/assets/produto-polo.jpg";
import produtoCamiseta from "@/assets/produto-camiseta.jpg";
import produtoJeans from "@/assets/produto-jeans.jpg";
import produtoMoletom from "@/assets/produto-moletom.jpg";
import produtoVestido from "@/assets/produto-vestido.jpg";

const imagemPorReferencia: Record<string, string> = {
  "MK-2024-001": produtoCamiseta,
  "MK-2024-002": produtoPolo,
  "MK-2024-003": produtoMoletom,
  "MK-2024-004": produtoVestido,
  "MK-2024-005": produtoJeans,
};

interface KanbanItem {
  id: string;
  ordemNumero: string;
  referencia: string;
  descricao: string;
  cliente: string;
  qtdCortada: number;
  status: string;
  precoPeca: number;
  dataPrevisao: string;
}

const kanbanColumns = [
  { key: "modelos", label: "Modelos", color: "hsl(271 71% 50%)" },
  { key: "corte", label: "Corte", color: "hsl(var(--primary))" },
  { key: "expedicao", label: "Expedição", color: "hsl(38 92% 50%)" },
  { key: "recebimento", label: "Recebimento", color: "hsl(199 89% 48%)" },
  { key: "entrega", label: "Entrega Cliente", color: "hsl(142 71% 35%)" },
];

const generateKanbanData = (): Record<string, KanbanItem[]> => {
  const c = clientes.map((cl) => cl.razaoSocial);
  const items: KanbanItem[] = [
    { id: "k1", ordemNumero: "OC-0002", referencia: "MK-2024-002", descricao: "Polo Masculina Manga Curta", cliente: c[0], qtdCortada: 300, status: "em_andamento", precoPeca: 18.5, dataPrevisao: "2025-03-05" },
    { id: "k2", ordemNumero: "OC-0003", referencia: "MK-2024-005", descricao: "Calça Jeans Skinny", cliente: c[2], qtdCortada: 200, status: "pendente", precoPeca: 45.0, dataPrevisao: "2025-03-08" },
    { id: "k3", ordemNumero: "OC-0004", referencia: "MK-2024-003", descricao: "Moletom Canguru Unissex", cliente: c[4], qtdCortada: 150, status: "pendente", precoPeca: 32.0, dataPrevisao: "2025-03-10" },
    { id: "k4", ordemNumero: "OC-0001", referencia: "MK-2024-001", descricao: "Camiseta Básica Gola Redonda", cliente: c[1], qtdCortada: 500, status: "em_andamento", precoPeca: 12.0, dataPrevisao: "2025-03-03" },
    { id: "k5", ordemNumero: "OC-0005", referencia: "MK-2024-004", descricao: "Vestido Midi Transpassado", cliente: c[5], qtdCortada: 120, status: "em_andamento", precoPeca: 55.0, dataPrevisao: "2025-03-06" },
    { id: "k6", ordemNumero: "OC-0006", referencia: "MK-2024-001", descricao: "Camiseta Básica Gola Redonda", cliente: c[0], qtdCortada: 400, status: "concluido", precoPeca: 12.0, dataPrevisao: "2025-03-01" },
    { id: "k7", ordemNumero: "OC-0007", referencia: "MK-2024-002", descricao: "Polo Masculina Manga Curta", cliente: c[3], qtdCortada: 250, status: "em_andamento", precoPeca: 18.5, dataPrevisao: "2025-03-04" },
    { id: "k8", ordemNumero: "OC-0008", referencia: "MK-2024-005", descricao: "Calça Jeans Skinny", cliente: c[1], qtdCortada: 180, status: "concluido", precoPeca: 45.0, dataPrevisao: "2025-02-28" },
    { id: "k9", ordemNumero: "OC-0009", referencia: "MK-2024-001", descricao: "Camiseta Básica Gola Redonda", cliente: c[4], qtdCortada: 600, status: "pendente", precoPeca: 12.0, dataPrevisao: "2025-03-07" },
  ];

  // Modelos aprovados aguardando início de produção
  const modelosAprovados: KanbanItem[] = [
    { id: "km1", ordemNumero: "—", referencia: "MK-2024-003", descricao: "Moletom Canguru Unissex", cliente: c[2], qtdCortada: 350, status: "pendente", precoPeca: 32.0, dataPrevisao: "2025-03-12" },
    { id: "km2", ordemNumero: "—", referencia: "MK-2024-004", descricao: "Vestido Midi Transpassado", cliente: c[0], qtdCortada: 200, status: "pendente", precoPeca: 55.0, dataPrevisao: "2025-03-15" },
    { id: "km3", ordemNumero: "—", referencia: "MK-2024-001", descricao: "Camiseta Básica Gola Redonda", cliente: c[3], qtdCortada: 800, status: "pendente", precoPeca: 12.0, dataPrevisao: "2025-03-18" },
  ];

  return {
    modelos: modelosAprovados,
    corte: items.slice(0, 3),
    expedicao: items.slice(3, 5),
    recebimento: items.slice(5, 7),
    entrega: items.slice(7),
  };
};

const kanbanData = generateKanbanData();

// Map column key to area label
const areaByColumn: Record<string, string> = {
  modelos: "Modelos",
  corte: "Corte",
  expedicao: "Expedição",
  recebimento: "Recebimento",
  entrega: "Entrega Cliente",
};

function KanbanCard({ item, area, onClickRef }: { item: KanbanItem; area: string; onClickRef: (item: KanbanItem & { area: string }) => void }) {
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2.5">
        <div className="w-full h-28 rounded-md bg-muted flex items-center justify-center overflow-hidden">
          <img
            src={imagemPorReferencia[item.referencia] || produtoCamiseta}
            alt={item.descricao}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => onClickRef({ ...item, area })}
            className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            {item.referencia}
          </button>
          <span className="text-[10px] text-muted-foreground">{item.ordemNumero}</span>
        </div>

        <p className="text-xs text-foreground font-medium leading-tight truncate">{item.descricao}</p>
        <p className="text-[11px] text-muted-foreground truncate">{item.cliente}</p>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Qtd: <span className="font-semibold text-foreground">{item.qtdCortada}</span>
          </span>
          <span className="text-muted-foreground">
            R$ <span className="font-semibold text-foreground">{item.precoPeca.toFixed(2)}</span>/pç
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarDays className="w-3 h-3" />
            {new Date(item.dataPrevisao).toLocaleDateString("pt-BR")}
          </div>
          <StatusBadge status={item.status} />
        </div>
      </CardContent>
    </Card>
  );
}

const RelatorioProducaoPage = () => {
  const [selectedItem, setSelectedItem] = useState<(KanbanItem & { area: string }) | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClickRef = (item: KanbanItem & { area: string }) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Fluxo de Produção"
        description="Kanban de acompanhamento por área de produção"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {kanbanColumns.map((col) => (
          <div key={col.key} className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
              <Badge variant="secondary" className="ml-auto text-[10px] h-5">
                {kanbanData[col.key]?.length || 0}
              </Badge>
            </div>
            <div className="flex-1 rounded-lg bg-muted/30 border border-border p-2 min-h-[400px]">
              {kanbanData[col.key]?.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  area={areaByColumn[col.key]}
                  onClickRef={handleClickRef}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <ConsultaProdutoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        imagemSrc={selectedItem ? imagemPorReferencia[selectedItem.referencia] : undefined}
      />
    </div>
  );
};

export default RelatorioProducaoPage;
