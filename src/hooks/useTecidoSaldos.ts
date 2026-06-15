import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetch-all-rows";

export interface TecidoSaldo {
  cliente_id: string;
  nome: string;
  cor: string;
  saldo: number;
}

/**
 * Saldos calculados diretamente a partir de `tecido_entradas`
 * (saldo = SUM(metragem_total) onde status != 'Alocado').
 * Independe da tabela `tecidos`, então funciona mesmo se a sincronização
 * via trigger falhar ou estiver pendente.
 */
export function useTecidoSaldos() {
  const [saldos, setSaldos] = useState<TecidoSaldo[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchAllRows((from, to) =>
      supabase
        .from("tecido_entradas")
        .select("cliente_id,nome_tecido,cor,status,metragem_total")
        .range(from, to),
    );
    const map = new Map<string, TecidoSaldo>();
    (data || []).forEach((e: any) => {
      if (!e.cliente_id || !e.nome_tecido) return;
      const cor = e.cor || "";
      const key = `${e.cliente_id}|${e.nome_tecido}|${cor}`;
      const qtd = Number(e.metragem_total || 0);
      const alocado = String(e.status || "").toLowerCase().startsWith("aloc");
      let row = map.get(key);
      if (!row) {
        row = { cliente_id: e.cliente_id, nome: e.nome_tecido, cor, saldo: 0 };
        map.set(key, row);
      }
      if (!alocado) row.saldo += qtd;
    });
    setSaldos(Array.from(map.values()));
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { saldos, loading, refetch };
}
