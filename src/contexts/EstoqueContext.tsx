import React, { createContext, useContext } from "react";
import { useTecidos, useEstoqueMovimentacoes } from "@/hooks/useSupabaseData";

interface EstoqueContextType {
  tecidosEstoque: any[];
  loading: boolean;
  getEstoqueDisponivel: (tecidoId: string) => number;
  getEstoqueReservado: (tecidoId: string) => number;
  getStatusEstoque: (tecidoId: string) => "disponivel" | "baixo" | "indisponivel";
  refetch: () => Promise<void>;
}

const EstoqueContext = createContext<EstoqueContextType | null>(null);

export function EstoqueProvider({ children }: { children: React.ReactNode }) {
  const { tecidos, loading, refetch } = useTecidos();

  const getEstoqueReservado = (_tecidoId: string) => 0;

  const getEstoqueDisponivel = (tecidoId: string) => {
    const t = tecidos.find((t: any) => t.id === tecidoId);
    return t ? Number(t.estoque_kg) : 0;
  };

  const getStatusEstoque = (tecidoId: string): "disponivel" | "baixo" | "indisponivel" => {
    const disponivel = getEstoqueDisponivel(tecidoId);
    if (disponivel <= 0) return "indisponivel";
    if (disponivel < 50) return "baixo";
    return "disponivel";
  };

  return (
    <EstoqueContext.Provider
      value={{
        tecidosEstoque: tecidos.map((t: any) => ({
          id: t.id,
          nome: t.nome,
          composicao: t.composicao || "",
          largura: t.largura || 0,
          peso: t.peso || 0,
          cor: t.cor || "",
          cliente: t.clientes?.razao_social || "",
          estoqueKg: Number(t.estoque_kg),
          precoKg: Number(t.preco_kg),
          status: t.status || "disponivel",
        })),
        loading,
        getEstoqueDisponivel,
        getEstoqueReservado,
        getStatusEstoque,
        refetch,
      }}
    >
      {children}
    </EstoqueContext.Provider>
  );
}

export function useEstoque() {
  const ctx = useContext(EstoqueContext);
  if (!ctx) throw new Error("useEstoque deve ser usado dentro de EstoqueProvider");
  return ctx;
}
