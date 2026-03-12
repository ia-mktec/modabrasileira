import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  disponivel: "bg-[hsl(142_71%_35%/0.15)] text-[hsl(142,71%,35%)] border-[hsl(142_71%_35%/0.3)]",
  baixo: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)] border-[hsl(38_92%_50%/0.3)]",
  indisponivel: "bg-[hsl(0_72%_51%/0.15)] text-[hsl(0,72%,51%)] border-[hsl(0_72%_51%/0.3)]",
  ativo: "bg-[hsl(142_71%_35%/0.15)] text-[hsl(142,71%,35%)] border-[hsl(142_71%_35%/0.3)]",
  inativo: "bg-[hsl(220_10%_46%/0.15)] text-muted-foreground border-[hsl(220_10%_46%/0.3)]",
  desenvolvimento: "bg-[hsl(217_71%_45%/0.15)] text-[hsl(217,71%,45%)] border-[hsl(217_71%_45%/0.3)]",
  pendente: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)] border-[hsl(38_92%_50%/0.3)]",
  em_andamento: "bg-[hsl(217_71%_45%/0.15)] text-[hsl(217,71%,45%)] border-[hsl(217_71%_45%/0.3)]",
  concluido: "bg-[hsl(142_71%_35%/0.15)] text-[hsl(142,71%,35%)] border-[hsl(142_71%_35%/0.3)]",
  cancelado: "bg-[hsl(0_72%_51%/0.15)] text-[hsl(0,72%,51%)] border-[hsl(0_72%_51%/0.3)]",
};

const statusLabels: Record<string, string> = {
  disponivel: "Disponível",
  baixo: "Estoque Baixo",
  indisponivel: "Indisponível",
  ativo: "Ativo",
  inativo: "Inativo",
  desenvolvimento: "Em Desenvolvimento",
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        statusStyles[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
