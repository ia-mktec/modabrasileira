export function parseDecimalInput(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Validates fabric consumption per piece in meters.
 * `modelos.consumo_tecido` and `ordens_corte.consumo_por_peca` are numeric(6,3)
 * (max 999.999), so values >= 1000 overflow Postgres and break parent-model sync.
 */
export function validateConsumoMetros(
  value: string | number | null | undefined,
  fieldLabel = "Consumo (Metros)",
): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const n = parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) {
    return `Informe um valor numérico válido (não negativo) para ${fieldLabel}.`;
  }
  if (n >= 1000) {
    return `${fieldLabel} deve ser menor que 1000 (ex: 2,16). Verifique se faltou a vírgula ou ponto decimal.`;
  }
  return null;
}