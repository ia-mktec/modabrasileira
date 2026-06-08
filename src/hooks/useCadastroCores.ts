import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cadastroCores as fallbackCores, type CadastroCor } from "@/lib/cadastro-cores";

/**
 * Catálogo de cores persistido em `cadastro_cores`.
 * Fonte única usada por Cadastro e Tecidos.
 */
export function useCadastroCores() {
  const [cores, setCores] = useState<CadastroCor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("cadastro_cores")
      .select("id, cor, cod, hex")
      .order("cor", { ascending: true });
    if (error || !data) {
      setCores(fallbackCores);
    } else {
      setCores(
        (data as any[]).map((r) => ({
          id: String(r.id),
          cor: r.cor,
          cod: r.cod,
          hex: r.hex || "#ffffff",
        })),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addCor = useCallback(
    async (cor: string, hex: string) => {
      // gera próximo código
      const { data: maxRow } = await (supabase as any)
        .from("cadastro_cores")
        .select("cod")
        .order("cod", { ascending: false })
        .limit(1)
        .maybeSingle();
      const max = parseInt(maxRow?.cod || "0", 10) || 0;
      const cod = String(max + 1).padStart(3, "0");
      const { error } = await (supabase as any)
        .from("cadastro_cores")
        .insert({ cor, cod, hex });
      if (error) throw error;
      await load();
    },
    [load],
  );

  const updateCor = useCallback(
    async (id: string, patch: Partial<Pick<CadastroCor, "cor" | "hex">>) => {
      const { error } = await (supabase as any)
        .from("cadastro_cores")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
      await load();
    },
    [load],
  );

  return { cores, loading, addCor, updateCor, reload: load };
}
