import React, { createContext, useContext, useState, useCallback } from "react";
import { tecidos as tecidosIniciais, type Tecido } from "@/lib/mock-data";

export interface ReservaEstoque {
  id: string;
  ordemCorte: string;
  tecidoId: string;
  tecidoNome: string;
  quantidadeReservadaKg: number;
  status: "reservado" | "confirmado" | "cancelado";
  dataReserva: string;
  dataConfirmacao?: string;
  perdaRealKg?: number;
}

interface EstoqueContextType {
  tecidosEstoque: Tecido[];
  reservas: ReservaEstoque[];
  getEstoqueDisponivel: (tecidoId: string) => number;
  getEstoqueReservado: (tecidoId: string) => number;
  reservarEstoque: (ordemCorte: string, tecidoId: string, tecidoNome: string, quantidadeKg: number) => boolean;
  confirmarBaixa: (ordemCorte: string, perdaRealPercent: number) => boolean;
  cancelarReserva: (ordemCorte: string) => void;
  getStatusEstoque: (tecidoId: string) => "disponivel" | "baixo" | "indisponivel";
}

const EstoqueContext = createContext<EstoqueContextType | null>(null);

export function EstoqueProvider({ children }: { children: React.ReactNode }) {
  const [tecidosEstoque, setTecidosEstoque] = useState<Tecido[]>(
    tecidosIniciais.map((t) => ({ ...t }))
  );
  const [reservas, setReservas] = useState<ReservaEstoque[]>([]);

  const getEstoqueReservado = useCallback(
    (tecidoId: string) =>
      reservas
        .filter((r) => r.tecidoId === tecidoId && r.status === "reservado")
        .reduce((s, r) => s + r.quantidadeReservadaKg, 0),
    [reservas]
  );

  const getEstoqueDisponivel = useCallback(
    (tecidoId: string) => {
      const tecido = tecidosEstoque.find((t) => t.id === tecidoId);
      if (!tecido) return 0;
      return tecido.estoqueKg - getEstoqueReservado(tecidoId);
    },
    [tecidosEstoque, getEstoqueReservado]
  );

  const getStatusEstoque = useCallback(
    (tecidoId: string): "disponivel" | "baixo" | "indisponivel" => {
      const disponivel = getEstoqueDisponivel(tecidoId);
      if (disponivel <= 0) return "indisponivel";
      if (disponivel < 50) return "baixo";
      return "disponivel";
    },
    [getEstoqueDisponivel]
  );

  const reservarEstoque = useCallback(
    (ordemCorte: string, tecidoId: string, tecidoNome: string, quantidadeKg: number): boolean => {
      const disponivel = getEstoqueDisponivel(tecidoId);
      if (quantidadeKg > disponivel) return false;

      const novaReserva: ReservaEstoque = {
        id: `res-${Date.now()}`,
        ordemCorte,
        tecidoId,
        tecidoNome,
        quantidadeReservadaKg: quantidadeKg,
        status: "reservado",
        dataReserva: new Date().toISOString().split("T")[0],
      };

      setReservas((prev) => [...prev, novaReserva]);
      return true;
    },
    [getEstoqueDisponivel]
  );

  const confirmarBaixa = useCallback(
    (ordemCorte: string, perdaRealPercent: number): boolean => {
      const reservasOrdem = reservas.filter(
        (r) => r.ordemCorte === ordemCorte && r.status === "reservado"
      );
      if (reservasOrdem.length === 0) return false;

      // Update tecido stock for all reservations of this order
      setTecidosEstoque((prev) => {
        let updated = [...prev];
        for (const reserva of reservasOrdem) {
          const perdaKg = reserva.quantidadeReservadaKg * (perdaRealPercent / 100);
          const consumoReal = reserva.quantidadeReservadaKg + perdaKg;
          updated = updated.map((t) => {
            if (t.id !== reserva.tecidoId) return t;
            const novoEstoque = Math.max(0, t.estoqueKg - consumoReal);
            return {
              ...t,
              estoqueKg: Math.round(novoEstoque * 100) / 100,
              status:
                novoEstoque <= 0
                  ? "indisponivel"
                  : novoEstoque < 50
                  ? "baixo"
                  : "disponivel",
            };
          });
        }
        return updated;
      });

      // Update all reservas for this order
      setReservas((prev) =>
        prev.map((r) =>
          r.ordemCorte === ordemCorte && r.status === "reservado"
            ? {
                ...r,
                status: "confirmado" as const,
                dataConfirmacao: new Date().toISOString().split("T")[0],
                perdaRealKg: Math.round(r.quantidadeReservadaKg * (perdaRealPercent / 100) * 100) / 100,
              }
            : r
        )
      );

      return true;
    },
    [reservas]
  );

  const cancelarReserva = useCallback((ordemCorte: string) => {
    setReservas((prev) =>
      prev.map((r) =>
        r.ordemCorte === ordemCorte && r.status === "reservado"
          ? { ...r, status: "cancelado" as const }
          : r
      )
    );
  }, []);

  return (
    <EstoqueContext.Provider
      value={{
        tecidosEstoque,
        reservas,
        getEstoqueDisponivel,
        getEstoqueReservado,
        reservarEstoque,
        confirmarBaixa,
        cancelarReserva,
        getStatusEstoque,
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
