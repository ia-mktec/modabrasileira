import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata datas no padrão pt-BR sem sofrer shift de fuso horário.
 * Aceita strings "YYYY-MM-DD" (date) ou ISO completos.
 * Para datas puras (sem hora), interpreta como local — evita o problema d-1.
 */
export function formatDateBR(value: string | Date | null | undefined): string {
  if (!value) return "—";
  if (value instanceof Date) return value.toLocaleDateString("pt-BR");
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `${d}/${mo}/${y}`;
  }
  // ISO com hora — usa parsing nativo
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}
