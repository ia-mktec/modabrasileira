import type { CadastroCor } from "@/lib/cadastro-cores";

export const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

export const normalizeColorSearch = (value: unknown) =>
  normalizeText(value)
    .replace(/\b(cor|cores|tom|tons|de|da|do|das|dos)\b/g, " ")
    .trim()
    .replace(/\s+/g, " ");

export const colorMatchesSearch = (color: unknown, search: unknown) => {
  const normalizedColor = normalizeText(color);
  const normalizedQuery = normalizeText(search);
  const cleanQuery = normalizeColorSearch(search);

  if (!cleanQuery && !normalizedQuery) return true;
  if (!normalizedColor) return false;

  return (
    normalizedColor.includes(cleanQuery) ||
    normalizedColor.includes(normalizedQuery) ||
    cleanQuery.includes(normalizedColor)
  );
};

export const findCadastroCor = (cores: CadastroCor[], color: unknown) => {
  const target = normalizeColorSearch(color);
  return cores.find((item) => normalizeColorSearch(item.cor) === target);
};

export const mergeCadastroCores = (primary: CadastroCor[], fallback: CadastroCor[]) => {
  const byName = new Map<string, CadastroCor>();
  fallback.forEach((item) => byName.set(normalizeColorSearch(item.cor), item));
  primary.forEach((item) => byName.set(normalizeColorSearch(item.cor), item));
  return Array.from(byName.values()).sort((a, b) => a.cor.localeCompare(b.cor, "pt-BR"));
};