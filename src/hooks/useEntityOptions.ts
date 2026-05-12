import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SearchableOption } from "@/components/shared/SearchableSelect";

export const STATUS_PEDIDO_OPTIONS: SearchableOption[] = [
  { value: "pendente", label: "Pendente" },
  { value: "em_corte", label: "Em Corte" },
  { value: "em_producao", label: "Em Produção" },
  { value: "recebido", label: "Recebido" },
  { value: "entregue", label: "Entregue" },
];

export const PILOTO_OPTIONS: SearchableOption[] = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];

interface EntityOptions {
  clientes: SearchableOption[];
  tecidos: SearchableOption[];
  cores: SearchableOption[];
  loading: boolean;
}

/**
 * Carrega opções cadastradas para uso em SearchableSelect:
 * - clientes: razao_social distintos da tabela `clientes`
 * - tecidos: nomes distintos de `tecidos`
 * - cores: cores distintas de `tecidos` + `modelo_pedidos`
 */
export function useEntityOptions(): EntityOptions {
  const [clientes, setClientes] = useState<SearchableOption[]>([]);
  const [tecidos, setTecidos] = useState<SearchableOption[]>([]);
  const [cores, setCores] = useState<SearchableOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [clientesRes, tecidosRes, pedidosCoresRes] = await Promise.all([
        supabase.from("clientes").select("razao_social").eq("status", "ativo").order("razao_social"),
        supabase.from("tecidos").select("nome,cor").order("nome"),
        supabase.from("modelo_pedidos").select("cor").not("cor", "is", null),
      ]);

      if (!mounted) return;

      const clienteSet = new Set<string>();
      (clientesRes.data || []).forEach((c: any) => {
        if (c.razao_social) clienteSet.add(c.razao_social.trim());
      });
      setClientes(
        Array.from(clienteSet).sort().map((c) => ({ value: c, label: c })),
      );

      const tecidoSet = new Set<string>();
      const corSet = new Set<string>();
      (tecidosRes.data || []).forEach((t: any) => {
        if (t.nome) tecidoSet.add(t.nome.trim());
        if (t.cor) corSet.add(t.cor.trim());
      });
      (pedidosCoresRes.data || []).forEach((p: any) => {
        if (p.cor) corSet.add(String(p.cor).trim());
      });

      setTecidos(
        Array.from(tecidoSet).sort().map((t) => ({ value: t, label: t })),
      );
      setCores(
        Array.from(corSet).sort().map((c) => ({ value: c, label: c })),
      );
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { clientes, tecidos, cores, loading };
}
