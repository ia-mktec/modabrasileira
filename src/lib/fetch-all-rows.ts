// Utilitário de paginação para contornar o limite padrão de 1000 linhas
// que o Supabase impõe em SELECTs sem .range().
//
// Uso:
//   const { data, error } = await fetchAllRows((from, to) =>
//     supabase.from("clientes").select("*").order("razao_social").range(from, to)
//   );

const PAGE_SIZE = 1000;

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

export async function fetchAllRows<T = unknown>(
  build: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize: number = PAGE_SIZE,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const all: T[] = [];
  let from = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) return { data: all, error };
    const batch = data || [];
    all.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return { data: all, error: null };
}
