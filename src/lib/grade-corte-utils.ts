export function normalizeGradeCor(cor: string | null | undefined): string {
  return String(cor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function findDuplicateGradeColors(rows: ReadonlyArray<{ cor: string }>): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const addedDup = new Set<string>();

  for (const row of rows) {
    const key = normalizeGradeCor(row.cor);
    if (!key) continue;
    if (seen.has(key)) {
      if (!addedDup.has(key)) {
        duplicates.push(row.cor.trim());
        addedDup.add(key);
      }
    } else {
      seen.add(key);
    }
  }
  return duplicates;
}

export function isCorJaNaGrade(
  rows: ReadonlyArray<{ id: string; cor: string }>,
  currentRowId: string | null,
  cor: string,
): boolean {
  const target = normalizeGradeCor(cor);
  if (!target) return false;
  return rows.some((r) => r.id !== currentRowId && normalizeGradeCor(r.cor) === target);
}